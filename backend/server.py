import os
import re
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from email_validator import validate_email, EmailNotValidError

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, EmailStr, field_validator, ValidationError
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pymongo.errors import DuplicateKeyError

# Load environment from backend/.env if present
load_dotenv()

# --- Environment & DB Setup ---
MONGO_URL = os.environ.get("MONGO_URL")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("EMERGENT_API_KEY")
if not MONGO_URL:
    raise RuntimeError("MONGO_URL is not set. Please set it in backend/.env as per platform configuration.")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="RealtorsPal AI - FastAPI Backend")

# Custom validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Validation error on {request.method} {request.url}")
    print(f"Validation errors: {exc.errors()}")
    
    # Log the request body for debugging
    try:
        body = await request.body()
        print(f"Request body: {body.decode()}")
    except Exception as e:
        print(f"Could not read request body: {e}")
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "message": "Validation failed"
        }
    )

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

E164_RE = re.compile(r"^\+[1-9]\d{7,14}$")

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

    # Name fields
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

    # Pipeline and details
    stage: str = Field(default="New")
    notes: Optional[str] = None
    property_type: Optional[str] = None
    neighborhood: Optional[str] = None
    price_min: Optional[int] = None
    price_max: Optional[int] = None
    priority: Optional[str] = None  # high|medium|low
    source_tags: Optional[List[str]] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    in_dashboard: Optional[bool] = True

class CreateLeadRequest(BaseModel):
    user_id: str
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    property_type: Optional[str] = None
    neighborhood: Optional[str] = None
    price_min: Optional[int] = None
    price_max: Optional[int] = None
    priority: Optional[str] = None
    source_tags: Optional[List[str]] = None
    notes: Optional[str] = None
    stage: Optional[str] = None
    in_dashboard: Optional[bool] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if v is not None and not E164_RE.match(v):
            raise ValueError("Phone must be in E.164 format, e.g. +1234567890")
        return v

class UpdateLeadRequest(BaseModel):
    # all fields optional for partial update
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    stage: Optional[str] = None
    notes: Optional[str] = None
    property_type: Optional[str] = None
    neighborhood: Optional[str] = None
    price_min: Optional[int] = None
    price_max: Optional[int] = None
    priority: Optional[str] = None
    source_tags: Optional[List[str]] = None
    in_dashboard: Optional[bool] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if v is not None and not E164_RE.match(v):
            raise ValueError("Phone must be in E.164 format, e.g. +1234567890")
        return v

class UpdateStageRequest(BaseModel):
    stage: str

class Settings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    webhook_enabled: Optional[bool] = False
    facebook_webhook_verify_token: Optional[str] = None
    generic_webhook_enabled: Optional[bool] = False

class AnalyticsDashboard(BaseModel):
    total_leads: int
    by_stage: Dict[str, int]

# Import payloads
class ImportItem(BaseModel):
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None  # Changed from EmailStr to str to be more lenient
    phone: Optional[str] = None
    property_type: Optional[str] = None
    neighborhood: Optional[str] = None
    price_min: Optional[int] = None
    price_max: Optional[int] = None
    priority: Optional[str] = None
    source_tags: Optional[List[str]] = None
    notes: Optional[str] = None
    stage: Optional[str] = None

class ImportPayload(BaseModel):
    user_id: str
    default_stage: Optional[str] = "New"
    in_dashboard: Optional[bool] = False
    leads: List[ImportItem]

class ImportResult(BaseModel):
    inserted: int
    skipped: int
    errors: List[Dict[str, Any]]
    inserted_leads: List[Lead]

# --- Utils ---
def normalize_phone(phone_str):
    """Normalize phone number to E.164 format"""
    if not phone_str:
        return None
    
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone_str)
    
    # If already has E.164 format, return as is
    if phone_str.startswith('+') and E164_RE.match(phone_str):
        return phone_str
    
    # Handle US numbers (10 or 11 digits)
    if len(digits) == 10:
        return f"+1{digits}"
    elif len(digits) == 11 and digits.startswith('1'):
        return f"+{digits}"
    
    # If it looks like it might be international but missing +, try adding it
    if len(digits) >= 7 and len(digits) <= 15:
        return f"+{digits}"
    
    # Return original if can't normalize
    return phone_str

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

# --- Startup: indexes & seed ---
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.leads.create_index([("user_id", 1)])
    # partial unique only when email exists as string
    try:
        async for idx in db.leads.list_indexes():
            if idx.get("name") == "user_id_1_email_1":
                await db.leads.drop_index("user_id_1_email_1")
                break
    except Exception:
        pass
    await db.leads.create_index(
        [("user_id", 1), ("email", 1)],
        unique=True,
        partialFilterExpression={"email": {"$type": "string"}},
    )
    await db.settings.create_index([("user_id", 1)], unique=True)

# --- Routes ---
@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/auth/demo", response_model=LoginResponse)
async def demo_session():
    demo_email = "demo@realtorspal.ai"
    user = await get_user_by_email(demo_email)
    if not user:
        user = await create_user(demo_email, "Demo123!", name="Demo User")
    return {"user": {"id": user["id"], "email": user["email"], "name": user.get("name")}, "token": "demo-token"}

@app.get("/api/leads", response_model=List[Lead])
async def list_leads(user_id: str):
    cursor = db.leads.find({"user_id": user_id})
    leads = []
    async for doc in cursor:
        leads.append(Lead(**{k: v for k, v in doc.items() if k != "_id"}))
    return leads

@app.post("/api/leads", response_model=Lead)
async def create_lead(payload: CreateLeadRequest):
    full_name = payload.name or " ".join([v for v in [payload.first_name, payload.last_name] if v]).strip() or "New Lead"
    in_dashboard = True if payload.in_dashboard is None else payload.in_dashboard
    stage = payload.stage or "New"
    lead = Lead(
        user_id=payload.user_id,
        name=full_name,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        property_type=payload.property_type,
        neighborhood=payload.neighborhood,
        price_min=payload.price_min,
        price_max=payload.price_max,
        priority=payload.priority,
        source_tags=payload.source_tags,
        notes=payload.notes,
        in_dashboard=in_dashboard,
        stage=stage,
    )
    try:
        await db.leads.insert_one(lead.model_dump(exclude_none=True))
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="A lead with this email already exists for this user.")
    return lead

@app.post("/api/leads/import", response_model=ImportResult)
async def import_leads(payload: ImportPayload):
    print(f"Import request received for user {payload.user_id}")
    print(f"Number of leads to import: {len(payload.leads)}")
    
    inserted = 0
    skipped = 0
    errors: List[Dict[str, Any]] = []
    inserted_docs: List[Lead] = []

    for idx, item in enumerate(payload.leads):
        try:
            print(f"Processing lead {idx}: {item.first_name} {item.last_name} - {item.email}")
            
            full_name = item.name or " ".join([v for v in [item.first_name, item.last_name] if v]).strip() or "New Lead"
            stage = item.stage or payload.default_stage or "New"
            
            # Validate and normalize email
            validated_email = None
            if item.email and item.email.strip():
                try:
                    # Use email-validator for more lenient validation
                    validation = validate_email(item.email.strip())
                    validated_email = validation.email
                    print(f"Email validated: '{item.email}' -> '{validated_email}'")
                except EmailNotValidError as e:
                    print(f"Invalid email '{item.email}': {e}")
                    # Skip lead with invalid email or set to None
                    validated_email = None
            
            # Normalize phone number
            normalized_phone = normalize_phone(item.phone)
            print(f"Phone normalized from '{item.phone}' to '{normalized_phone}'")
            
            lead = Lead(
                user_id=payload.user_id,
                name=full_name,
                first_name=item.first_name,
                last_name=item.last_name,
                email=validated_email,
                phone=normalized_phone,
                property_type=item.property_type,
                neighborhood=item.neighborhood,
                price_min=item.price_min,
                price_max=item.price_max,
                priority=item.priority,
                source_tags=item.source_tags,
                notes=item.notes,
                in_dashboard=payload.in_dashboard,
                stage=stage,
            )
            await db.leads.insert_one(lead.model_dump(exclude_none=True))
            inserted += 1
            inserted_docs.append(lead)
            print(f"Successfully inserted lead {idx}")
        except DuplicateKeyError:
            skipped += 1
            error_msg = "duplicate email for this user"
            errors.append({"row": idx, "email": item.email, "reason": error_msg})
            print(f"Skipped lead {idx}: {error_msg}")
        except Exception as e:
            skipped += 1
            error_msg = str(e)
            errors.append({"row": idx, "reason": error_msg})
            print(f"Error processing lead {idx}: {error_msg}")
            print(f"Lead data: {item}")

    print(f"Import completed: {inserted} inserted, {skipped} skipped")
    return ImportResult(inserted=inserted, skipped=skipped, errors=errors, inserted_leads=inserted_docs)

@app.put("/api/leads/{lead_id}/stage", response_model=Lead)
async def update_lead_stage(lead_id: str, payload: UpdateStageRequest):
    doc = await db.leads.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    await db.leads.update_one({"id": lead_id}, {"$set": {"stage": payload.stage}})
    updated = await db.leads.find_one({"id": lead_id})
    return Lead(**{k: v for k, v in updated.items() if k != "_id"})

@app.put("/api/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, payload: UpdateLeadRequest):
    doc = await db.leads.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    data = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not data:
        return Lead(**{k: v for k, v in doc.items() if k != "_id"})
    try:
        await db.leads.update_one({"id": lead_id}, {"$set": data})
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="A lead with this email already exists for this user.")
    updated = await db.leads.find_one({"id": lead_id})
    return Lead(**{k: v for k, v in updated.items() if k != "_id"})

@app.delete("/api/leads/{lead_id}")
async def delete_lead(lead_id: str):
    doc = await db.leads.find_one({"id": lead_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    await db.leads.delete_one({"id": lead_id})
    return {"ok": True}

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