import os
import uuid
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment from backend/.env if present
load_dotenv()

# --- Environment & DB Setup ---
MONGO_URL = os.environ.get("MONGO_URL")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("EMERGENT_API_KEY")
if not MONGO_URL:
    raise RuntimeError("MONGO_URL is not set. Please set it in backend/.env as per platform configuration.")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="RealtorsPal AI - FastAPI Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mongo client
client = AsyncIOMotorClient(MONGO_URL)
db = client["realtorspal"]

# Try import Emergent integrations client in a resilient way
EmergentAsyncClient = None
try:
    from emergentintegrations import AsyncLLMClient as EmergentAsyncClient  # type: ignore
except Exception:
    try:
        from emergentintegrations.llm import AsyncLLMClient as EmergentAsyncClient  # type: ignore
    except Exception:
        EmergentAsyncClient = None

# --- Models ---
class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    user: UserOut
    token: str

class Lead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    # Display name (kept for backward compat)
    name: Optional[str] = None
    # New fields
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None

    stage: str = Field(default="New")
    notes: Optional[str] = None

class CreateLeadRequest(BaseModel):
    user_id: str
    # Optional fields; server will derive display name
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None

class UpdateStageRequest(BaseModel):
    stage: str

class Settings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None

class AnalyticsDashboard(BaseModel):
    total_leads: int
    by_stage: Dict[str, int]

# AI request/response
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    user_id: str
    messages: List[ChatMessage]
    provider: Optional[str] = None  # openai|anthropic|gemini|emergent
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 512
    stream: Optional[bool] = False

class ChatResponse(BaseModel):
    content: str
    provider_used: str
    model_used: Optional[str] = None

# --- Utils ---
async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    return await db.users.find_one({"email": email})

async def create_user(email: str, password: str, name: Optional[str] = None) -> Dict[str, Any]:
    hashed = pwd_context.hash(password)
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hashed,
        "name": name or "Demo User",
    }
    await db.users.insert_one(user)
    return user

async def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# --- Startup: seed demo user and indexes ---
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.leads.create_index([("user_id", 1)])
    await db.leads.create_index([("email", 1)])
    await db.settings.create_index([("user_id", 1)], unique=True)

    # Seed demo user
    demo_email = "demo@realtorspal.ai"
    demo_password = "Demo123!"
    existing = await get_user_by_email(demo_email)
    if not existing:
        user = await create_user(demo_email, demo_password, name="Demo User")
        # Seed sample leads for demo user with new fields
        sample = [
            {"first_name": "John", "last_name": "Carter", "email": "john.carter@example.com", "stage": "New"},
            {"first_name": "Mia", "last_name": "Nguyen", "email": "mia.nguyen@example.com", "stage": "Contacted"},
            {"first_name": "Isabella", "last_name": "Garcia", "email": "isabella.garcia@example.com", "stage": "Appointment"},
            {"first_name": "Liam", "last_name": "Johnson", "email": "liam.johnson@example.com", "stage": "Onboarded"},
            {"first_name": "Sophia", "last_name": "Martinez", "email": "sophia.martinez@example.com", "stage": "Closed"},
        ]
        docs = []
        for s in sample:
            full_name = f"{s['first_name']} {s['last_name']}".strip()
            docs.append({
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "name": full_name,
                "first_name": s["first_name"],
                "last_name": s["last_name"],
                "email": s["email"],
                "stage": s["stage"],
                "notes": None,
            })
        if docs:
            await db.leads.insert_many(docs)

# --- Routes ---
@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.post("/api/auth/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    user = await get_user_by_email(payload.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not await verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "user": {"id": user["id"], "email": user["email"], "name": user.get("name")},
        "token": "demo-token",
    }

@app.get("/api/leads", response_model=List[Lead])
async def list_leads(user_id: str):
    cursor = db.leads.find({"user_id": user_id})
    leads = []
    async for doc in cursor:
        leads.append(Lead(**{k: v for k, v in doc.items() if k != "_id"}))
    return leads

@app.post("/api/leads", response_model=Lead)
async def create_lead(payload: CreateLeadRequest):
    # derive display name
    full_name = payload.name or " ".join([v for v in [payload.first_name, payload.last_name] if v]).strip() or "New Lead"
    lead = Lead(
        user_id=payload.user_id,
        name=full_name,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
    )
    await db.leads.insert_one(lead.model_dump())
    return lead

@app.put("/api/leads/{lead_id}/stage", response_model=Lead)
async def update_lead_stage(lead_id: str, payload: UpdateStageRequest):
    doc = await db.leads.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    await db.leads.update_one({"id": lead_id}, {"$set": {"stage": payload.stage}})
    updated = await db.leads.find_one({"id": lead_id})
    return Lead(**{k: v for k, v in updated.items() if k != "_id"})

@app.get("/api/analytics/dashboard", response_model=AnalyticsDashboard)
async def analytics_dashboard(user_id: str):
    stages = ["New", "Contacted", "Appointment", "Onboarded", "Closed"]
    counts: Dict[str, int] = {s: 0 for s in stages}
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$stage", "count": {"$sum": 1}}},
    ]
    agg = db.leads.aggregate(pipeline)
    async for row in agg:
        stage = row.get("_id")
        if stage in counts:
            counts[stage] = row.get("count", 0)
    total = sum(counts.values())
    return AnalyticsDashboard(total_leads=total, by_stage=counts)

@app.get("/api/settings", response_model=Settings)
async def get_settings(user_id: str):
    doc = await db.settings.find_one({"user_id": user_id})
    if not doc:
        settings = Settings(user_id=user_id)
        await db.settings.insert_one(settings.model_dump())
        return settings
    return Settings(**{k: v for k, v in doc.items() if k != "_id"})

class SaveSettingsRequest(BaseModel):
    user_id: str
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None

@app.post("/api/settings", response_model=Settings)
async def save_settings(payload: SaveSettingsRequest):
    existing = await db.settings.find_one({"user_id": payload.user_id})
    data = {k: v for k, v in payload.model_dump().items() if k != "id"}
    if existing:
        await db.settings.update_one({"user_id": payload.user_id}, {"$set": data})
        doc = await db.settings.find_one({"user_id": payload.user_id})
        return Settings(**{k: v for k, v in doc.items() if k != "_id"})
    else:
        settings = Settings(**data)
        await db.settings.insert_one(settings.model_dump())
        return settings

# --- AI Chat Endpoint (unified, uses Emergent LLM or user provider keys) ---
async def _resolve_provider_and_key(user_id: str, provider: Optional[str]) -> Dict[str, Optional[str]]:
    doc = await db.settings.find_one({"user_id": user_id})
    openai_key = (doc or {}).get("openai_api_key")
    anthropic_key = (doc or {}).get("anthropic_api_key")
    gemini_key = (doc or {}).get("gemini_api_key")

    chosen_provider = (provider or "emergent").lower()
    provider_key = None
    if chosen_provider == "openai":
        provider_key = openai_key
    elif chosen_provider == "anthropic":
        provider_key = anthropic_key
    elif chosen_provider == "gemini":
        provider_key = gemini_key
    else:
        chosen_provider = "emergent"
        provider_key = EMERGENT_LLM_KEY

    if not provider_key and EMERGENT_LLM_KEY:
        chosen_provider = "emergent"
        provider_key = EMERGENT_LLM_KEY

    return {"provider": chosen_provider, "key": provider_key}

async def _call_emergent_llm(
    api_key: str,
    messages: List[Dict[str, str]],
    provider: Optional[str],
    model: Optional[str],
    temperature: Optional[float],
    max_tokens: Optional[int],
    stream: bool,
):
    if EmergentAsyncClient is None:
        raise ImportError("emergentintegrations not installed")

    client = EmergentAsyncClient(api_key=api_key)

    # Compose params
    params: Dict[str, Any] = {
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": stream,
    }
    if model:
        params["model"] = model
    if provider:
        params["provider"] = provider

    return await client.chat_completions.create(**params)

@app.post("/api/ai/chat", response_model=ChatResponse)
async def ai_chat(req: ChatRequest):
    resolved = await _resolve_provider_and_key(req.user_id, req.provider)
    provider = resolved["provider"]
    key = resolved["key"]

    if not key:
        raise HTTPException(status_code=400, detail="LLM not configured. Add provider key in Settings or ensure Emergent key is set.")

    try:
        messages = [m.model_dump() for m in req.messages]
        result = await _call_emergent_llm(
            api_key=key,
            messages=messages,
            provider=provider,
            model=req.model,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
            stream=False,
        )
        # Normalize common shapes
        content: Optional[str] = None
        if isinstance(result, dict):
            if "choices" in result and result["choices"]:
                choice = result["choices"][0]
                if isinstance(choice, dict):
                    msg = choice.get("message") or {}
                    content = msg.get("content")
            if not content:
                content = result.get("content")
        else:
            content = getattr(result, "content", None)

        if not content:
            content = "(No content returned by LLM)"

        return ChatResponse(content=content, provider_used=provider, model_used=req.model)
    except ImportError:
        # SDK not available
        raise HTTPException(
            status_code=501,
            detail="LLM integration pending: Emergent integrations SDK not available in runtime."
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM call failed: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)