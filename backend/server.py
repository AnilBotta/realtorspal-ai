import os
import re
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Union
from email_validator import validate_email, EmailNotValidError
from twilio.rest import Client as TwilioClient

from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, StreamingResponse, Response, Response
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
    api_key: Optional[str] = None  # API key for external integrations
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    twilio_whatsapp_number: Optional[str] = None
    twilio_api_key: Optional[str] = None
    twilio_api_secret: Optional[str] = None
    smtp_protocol: Optional[str] = None
    smtp_hostname: Optional[str] = None
    smtp_port: Optional[str] = None
    smtp_ssl_tls: Optional[bool] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_from_name: Optional[str] = None

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

# --- API Authentication ---
async def authenticate_api_key(api_key: str) -> Optional[str]:
    """Authenticate API key and return user_id"""
    settings_doc = await db.settings.find_one({"api_key": api_key})
    if settings_doc:
        return settings_doc.get("user_id")
    return None

def generate_api_key() -> str:
    """Generate a secure API key"""
    return f"crm_{uuid.uuid4().hex[:16]}_{uuid.uuid4().hex[:16]}"

# --- External API Endpoints for Crew.AI Integration ---

class CreateLeadExternalRequest(BaseModel):
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    property_type: Optional[str] = None
    neighborhood: Optional[str] = None
    price_min: Optional[int] = None
    price_max: Optional[int] = None
    priority: Optional[str] = "medium"
    source_tags: Optional[List[str]] = ["API"]
    notes: Optional[str] = None
    stage: Optional[str] = "New"
    in_dashboard: Optional[bool] = True

class UpdateLeadExternalRequest(BaseModel):
    name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
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

class UpdateLeadStatusRequest(BaseModel):
    stage: str
    notes: Optional[str] = None

class SearchLeadsRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    name: Optional[str] = None
    stage: Optional[str] = None
    limit: Optional[int] = 10

@app.post("/api/external/leads", response_model=Lead)
async def create_lead_external(lead_data: CreateLeadExternalRequest, api_key: str = Header(..., alias="X-API-Key")):
    """Create a new lead via external API (Third-party app integration)"""
    try:
        # Authenticate API key
        user_id = await authenticate_api_key(api_key)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Validate and normalize email
        validated_email = None
        if lead_data.email and lead_data.email.strip():
            try:
                validation = validate_email(lead_data.email.strip())
                validated_email = validation.email
            except EmailNotValidError:
                validated_email = None
        
        # Normalize phone number
        normalized_phone = normalize_phone(lead_data.phone)
        
        # Create lead name if not provided
        name = lead_data.name
        if not name:
            name = f"{lead_data.first_name or ''} {lead_data.last_name or ''}".strip() or "New Lead"
        
        lead = Lead(
            user_id=user_id,
            name=name,
            first_name=lead_data.first_name,
            last_name=lead_data.last_name,
            email=validated_email,
            phone=normalized_phone,
            property_type=lead_data.property_type,
            neighborhood=lead_data.neighborhood,
            price_min=lead_data.price_min,
            price_max=lead_data.price_max,
            priority=lead_data.priority,
            source_tags=lead_data.source_tags,
            notes=lead_data.notes,
            stage=lead_data.stage,
            in_dashboard=lead_data.in_dashboard
        )
        
        await db.leads.insert_one(lead.model_dump(exclude_none=True))
        return lead
        
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Lead with this email already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/external/leads/{lead_id}", response_model=Lead)
async def update_lead_external(lead_id: str, lead_data: UpdateLeadExternalRequest, api_key: str = Header(..., alias="X-API-Key")):
    """Update an existing lead via external API (Third-party app integration)"""
    try:
        # Authenticate API key
        user_id = await authenticate_api_key(api_key)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Check if lead exists and belongs to user
        existing_lead = await db.leads.find_one({"id": lead_id, "user_id": user_id})
        if not existing_lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Prepare update data
        update_data = {}
        for field, value in lead_data.model_dump(exclude_none=True).items():
            if field == "email" and value:
                # Validate email
                try:
                    validation = validate_email(value.strip())
                    update_data[field] = validation.email
                except EmailNotValidError:
                    pass  # Skip invalid email
            elif field == "phone" and value:
                # Normalize phone
                update_data[field] = normalize_phone(value)
            else:
                update_data[field] = value
        
        # Update name if first_name or last_name changed
        if "first_name" in update_data or "last_name" in update_data:
            first_name = update_data.get("first_name", existing_lead.get("first_name", ""))
            last_name = update_data.get("last_name", existing_lead.get("last_name", ""))
            update_data["name"] = f"{first_name or ''} {last_name or ''}".strip() or existing_lead.get("name")
        
        # Update lead
        await db.leads.update_one({"id": lead_id}, {"$set": update_data})
        
        # Return updated lead
        updated_lead = await db.leads.find_one({"id": lead_id})
        return Lead(**{k: v for k, v in updated_lead.items() if k != "_id"})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/external/leads/search")
async def search_leads_external(search_data: SearchLeadsRequest, api_key: str = Header(..., alias="X-API-Key")):
    """Search leads via external API (Third-party app integration)"""
    try:
        # Authenticate API key
        user_id = await authenticate_api_key(api_key)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Build search query
        query = {"user_id": user_id}
        
        if search_data.email:
            query["email"] = {"$regex": search_data.email, "$options": "i"}
        if search_data.phone:
            # Normalize phone for search
            normalized_phone = normalize_phone(search_data.phone)
            query["phone"] = normalized_phone
        if search_data.name:
            query["$or"] = [
                {"name": {"$regex": search_data.name, "$options": "i"}},
                {"first_name": {"$regex": search_data.name, "$options": "i"}},
                {"last_name": {"$regex": search_data.name, "$options": "i"}}
            ]
        if search_data.stage:
            query["stage"] = search_data.stage
        
        # Search leads
        leads = await db.leads.find(query).limit(search_data.limit or 10).to_list(length=None)
        return [Lead(**{k: v for k, v in lead.items() if k != "_id"}) for lead in leads]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/external/leads/{lead_id}/status", response_model=Lead)
async def update_lead_status_external(lead_id: str, status_data: UpdateLeadStatusRequest, api_key: str = Header(..., alias="X-API-Key")):
    """Update lead status/stage via external API (Third-party app integration)"""
    try:
        # Authenticate API key
        user_id = await authenticate_api_key(api_key)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Check if lead exists and belongs to user
        existing_lead = await db.leads.find_one({"id": lead_id, "user_id": user_id})
        if not existing_lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Prepare update data
        update_data = {"stage": status_data.stage}
        if status_data.notes:
            # Append notes to existing notes
            existing_notes = existing_lead.get("notes", "")
            if existing_notes:
                update_data["notes"] = f"{existing_notes}\n\n[API Update] {status_data.notes}"
            else:
                update_data["notes"] = f"[API Update] {status_data.notes}"
        
        # Update lead
        await db.leads.update_one({"id": lead_id}, {"$set": update_data})
        
        # Return updated lead
        updated_lead = await db.leads.find_one({"id": lead_id})
        return Lead(**{k: v for k, v in updated_lead.items() if k != "_id"})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/external/leads/{lead_id}", response_model=Lead)
async def get_lead_external(lead_id: str, api_key: str = Header(..., alias="X-API-Key")):
    """Get a specific lead via external API (Third-party app integration)"""
    try:
        # Authenticate API key
        user_id = await authenticate_api_key(api_key)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Get lead
        lead = await db.leads.find_one({"id": lead_id, "user_id": user_id})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        return Lead(**{k: v for k, v in lead.items() if k != "_id"})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- TwiML Endpoints for WebRTC Calling ---

@app.get("/api/twiml/outbound-call")
@app.post("/api/twiml/outbound-call")
async def outbound_call_twiml(request: Request):
    """TwiML endpoint for WebRTC outbound calls - connects lead to agent's browser"""
    try:
        # Get query parameters from Twilio call
        params = dict(request.query_params)
        
        # Extract parameters (these will be passed from our WebRTC call initiation)
        agent_identity = params.get('agent_identity', 'agent_unknown')
        lead_phone = params.get('lead_phone', '')
        
        print(f"Outbound call TwiML: connecting {lead_phone} to WebRTC client {agent_identity}")
        
        # TwiML to connect the lead to the agent's WebRTC client (browser)
        twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Please hold while we connect you to your real estate agent.</Say>
    <Dial timeout="30" timeLimit="3600">
        <Client>{agent_identity}</Client>
    </Dial>
    <Say voice="alice">Sorry, the agent is not available right now. Please try again later.</Say>
</Response>"""
        
        return Response(content=twiml_response, media_type="application/xml")
        
    except Exception as e:
        print(f"TwiML outbound call error: {e}")
        # Fallback TwiML
        fallback_twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, there was an error connecting your call. Please try again later.</Say>
</Response>"""
        return Response(content=fallback_twiml, media_type="application/xml")

@app.get("/api/twiml/client-incoming")
@app.post("/api/twiml/client-incoming")
async def client_incoming_twiml(request: Request):
    """TwiML endpoint for incoming calls to WebRTC client (agent's browser)"""
    try:
        # This handles when someone calls the agent's WebRTC client directly
        params = dict(request.query_params)
        from_number = params.get('From', 'Unknown')
        
        print(f"Incoming call to WebRTC client from: {from_number}")
        
        # TwiML to handle incoming calls to the agent's browser
        twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">You have an incoming call from {from_number}.</Say>
    <Dial timeout="30">
        <Number>{from_number}</Number>
    </Dial>
</Response>"""
        
        return Response(content=twiml_response, media_type="application/xml")
        
    except Exception as e:
        print(f"TwiML client incoming error: {e}")
        fallback_twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Unable to process the incoming call.</Say>
</Response>"""
        return Response(content=fallback_twiml, media_type="application/xml")

# --- Updated Access Token Generation ---

class TwilioCallRequest(BaseModel):
    lead_id: str
    agent_phone: Optional[str] = None  # Agent's phone number to connect to
    message: Optional[str] = "Connecting you to your real estate agent now."

class TwilioWebRTCCallRequest(BaseModel):
    lead_id: str
    message: Optional[str] = "Hello, this is your real estate agent calling about your property inquiry."

class TwilioSMSRequest(BaseModel):
    lead_id: str
    message: str

class TwilioWhatsAppRequest(BaseModel):
    lead_id: str
    message: str

class AccessTokenRequest(BaseModel):
    user_id: str

async def get_twilio_client(user_id: str) -> Optional[TwilioClient]:
    """Get configured Twilio client for user"""
    settings_doc = await db.settings.find_one({"user_id": user_id})
    if not settings_doc:
        return None
        
    account_sid = settings_doc.get("twilio_account_sid")
    auth_token = settings_doc.get("twilio_auth_token")
    
    if not account_sid or not auth_token:
        return None
        
    return TwilioClient(account_sid, auth_token)

@app.post("/api/twilio/access-token")
async def generate_access_token(token_request: AccessTokenRequest):
    """Generate Twilio access token for WebRTC calling using API Keys"""
    try:
        # Get user settings
        settings = await db.settings.find_one({"user_id": token_request.user_id})
        if not settings:
            raise HTTPException(status_code=400, detail="User settings not found")
        
        account_sid = settings.get("twilio_account_sid")
        api_key = settings.get("twilio_api_key")
        api_secret = settings.get("twilio_api_secret")
        
        # Check if all required credentials are present
        if not account_sid or not api_key or not api_secret:
            missing_fields = []
            if not account_sid: missing_fields.append("Account SID")
            if not api_key: missing_fields.append("API Key SID")  
            if not api_secret: missing_fields.append("API Key Secret")
            
            return {
                "status": "setup_required",
                "message": f"Missing Twilio credentials: {', '.join(missing_fields)}",
                "setup_instructions": {
                    "step1": "Go to Twilio Console → Account → API Keys & Tokens",
                    "step2": "Create new API Key with Voice grants enabled",
                    "step3": "Copy the API Key SID and Secret to Settings",
                    "step4": "Make sure Account SID is also configured"
                }
            }
        
        # Import Twilio components for access token
        from twilio.jwt.access_token import AccessToken
        from twilio.jwt.access_token.grants import VoiceGrant
        
        try:
            # Create access token using API Keys (proper way for WebRTC)
            identity = f"agent_{token_request.user_id}"
            
            token = AccessToken(
                account_sid,
                api_key,      # API Key SID
                api_secret,   # API Key Secret
                identity=identity
            )
            
            # Get base URL for TwiML endpoints
            base_url = os.environ.get('REACT_APP_BACKEND_URL', 'https://ai-agent-comm.preview.emergentagent.com')
            
            # Create voice grant with our TwiML endpoints
            voice_grant = VoiceGrant(
                outgoing_application_sid=None,  # We'll handle TwiML via URL parameters
                incoming_allow=True  # Allow incoming calls to the WebRTC client
            )
            token.add_grant(voice_grant)
            
            # Generate the JWT token
            jwt_token = token.to_jwt()
            
            # Log token generation for debugging
            print(f"Generated WebRTC access token for user {token_request.user_id}")
            print(f"Token identity: {identity}")
            print(f"Account SID: {account_sid}")
            print(f"API Key: {api_key}")
            
            return {
                "status": "success", 
                "token": jwt_token,
                "identity": identity,
                "expires_in": 3600,
                "account_sid": account_sid,  # Include for debugging
                "debug_info": {
                    "token_length": len(jwt_token),
                    "api_key_prefix": api_key[:8] + "...",
                    "account_sid_prefix": account_sid[:8] + "..."
                }
            }
            
        except Exception as token_error:
            print(f"Token generation failed: {token_error}")
            return {
                "status": "error",
                "message": f"Failed to generate access token: {str(token_error)}",
                "suggestion": "Please verify your API Key and Secret are correct in Settings"
            }
        
    except Exception as e:
        print(f"Access token generation error: {e}")
        return {
            "status": "error", 
            "message": f"Access token error: {str(e)}"
        }

@app.post("/api/twilio/webrtc-call")
async def initiate_webrtc_call(call_data: TwilioWebRTCCallRequest):
    """Initiate a WebRTC call using Twilio REST API - Direct connection between agent browser and lead phone"""
    try:
        # Get lead details
        lead = await db.leads.find_one({"id": call_data.lead_id})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Get user's Twilio settings
        settings = await db.settings.find_one({"user_id": lead["user_id"]})
        if not settings:
            return {"status": "error", "message": "User settings not found"}
        
        account_sid = settings.get("twilio_account_sid")
        auth_token = settings.get("twilio_auth_token")
        twilio_phone = settings.get("twilio_phone_number")
        api_key = settings.get("twilio_api_key")
        api_secret = settings.get("twilio_api_secret")
        
        # Check required credentials
        if not all([account_sid, auth_token, twilio_phone, api_key, api_secret]):
            missing = []
            if not account_sid: missing.append("Account SID")
            if not auth_token: missing.append("Auth Token")
            if not twilio_phone: missing.append("Phone Number")
            if not api_key: missing.append("API Key SID")
            if not api_secret: missing.append("API Key Secret")
            
            return {
                "status": "error",
                "message": f"Missing Twilio credentials: {', '.join(missing)}",
                "setup_required": True
            }
        
        if not lead.get("phone"):
            return {"status": "error", "message": "Lead has no phone number"}
        
        # Get Twilio client for REST API calls
        client = await get_twilio_client(lead["user_id"])
        if not client:
            return {"status": "error", "message": "Failed to initialize Twilio client"}
        
        # Create TwiML URL with parameters for WebRTC connection
        base_url = os.environ.get('REACT_APP_BACKEND_URL', 'https://ai-agent-comm.preview.emergentagent.com')
        agent_identity = f"agent_{lead['user_id']}"
        
        # URL encode parameters for TwiML endpoint
        from urllib.parse import quote
        twiml_url = f"{base_url}/api/twiml/outbound-call?agent_identity={quote(agent_identity)}&lead_phone={quote(lead['phone'])}"
        
        print(f"Initiating WebRTC call: {twilio_phone} → {lead['phone']} → WebRTC client {agent_identity}")
        print(f"TwiML URL: {twiml_url}")
        
        # Use Twilio REST API to create outbound call
        call = client.calls.create(
            from_=twilio_phone,           # Your Twilio phone number
            to=lead["phone"],             # Lead's phone number  
            url=twiml_url,                # Our TwiML endpoint that connects to WebRTC client
            method='GET'
        )
        
        # Log the WebRTC call activity
        current_notes = lead.get('notes', '')
        new_note = f"\n\n[WebRTC Call] Browser call initiated - Twilio: {twilio_phone} → Lead: {lead['phone']} → Agent Browser - {datetime.now().isoformat()}"
        await db.leads.update_one(
            {"id": call_data.lead_id},
            {"$set": {"notes": current_notes + new_note}}
        )
        
        return {
            "status": "success",
            "call_sid": call.sid,
            "message": "WebRTC call initiated successfully. The lead will receive a call and be connected to your browser.",
            "call_flow": f"Twilio calls {lead['phone']} → Lead answers → Connected to your browser microphone/speakers",
            "agent_identity": agent_identity,
            "lead_phone": lead["phone"]
        }
        
    except Exception as e:
        print(f"WebRTC call initiation error: {e}")
        return {"status": "error", "message": f"Call failed: {str(e)}"}

@app.get("/api/twilio/voice")
@app.post("/api/twilio/voice")
async def voice_webhook(request: Request):
    """Twilio voice webhook that handles incoming calls and creates bridge"""
    try:
        # Get query parameters from Twilio
        params = dict(request.query_params)
        
        # Get the agent phone and message from the webhook parameters
        agent_phone = params.get('agent_phone')
        encoded_message = params.get('message', 'Connecting you to your real estate agent now.')
        lead_phone = params.get('lead_phone')
        
        # URL decode the message
        from urllib.parse import unquote
        message = unquote(encoded_message)
        
        print(f"Voice webhook called: agent_phone={agent_phone}, lead_phone={lead_phone}, message={message}")
        
        # Generate TwiML response
        twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">{message}</Say>
    <Dial callerId="+{agent_phone if agent_phone else '12894012412'}" timeout="30" timeLimit="3600">
        +{agent_phone if agent_phone else '12894012412'}
    </Dial>
    <Say voice="alice">The call could not be connected. Please try again later.</Say>
</Response>"""
        
        return Response(content=twiml_response, media_type="application/xml")
        
    except Exception as e:
        print(f"Voice webhook error: {e}")
        # Fallback TwiML
        fallback_twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, there was an error connecting your call. Please try again later.</Say>
</Response>"""
        return Response(content=fallback_twiml, media_type="application/xml")

@app.post("/api/twilio/call")
async def initiate_call(call_data: TwilioCallRequest):
    """Initiate a call via Twilio with voice bridge"""
    try:
        # Get lead details
        lead = await db.leads.find_one({"id": call_data.lead_id})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Get Twilio client
        client = await get_twilio_client(lead["user_id"])
        if not client:
            return {
                "status": "error", 
                "message": "Twilio not configured. Please add your Twilio credentials in Settings to enable calling.",
                "setup_instructions": {
                    "step1": "Go to Settings > Twilio Communication",
                    "step2": "Add your Twilio Account SID and Auth Token",
                    "step3": "Add your Twilio phone number",
                    "step4": "Save settings and try calling again"
                }
            }
        
        # Get user's Twilio settings
        settings = await db.settings.find_one({"user_id": lead["user_id"]})
        twilio_phone = settings.get("twilio_phone_number")
        
        if not twilio_phone:
            raise HTTPException(status_code=400, detail="Twilio phone number not configured. Please add your Twilio phone number in Settings.")
        
        if not lead.get("phone"):
            raise HTTPException(status_code=400, detail="Lead has no phone number")
        
        # Clean phone numbers and encode message for URL
        clean_twilio_phone = twilio_phone.replace('+', '')
        clean_lead_phone = lead["phone"].replace('+', '')
        
        # URL encode the message
        from urllib.parse import quote
        encoded_message = quote(call_data.message)
        
        # Create voice webhook URL with parameters
        base_url = os.environ.get('REACT_APP_BACKEND_URL', 'https://ai-agent-comm.preview.emergentagent.com')
        voice_webhook_url = f"{base_url}/api/twilio/voice?agent_phone={clean_twilio_phone}&lead_phone={clean_lead_phone}&message={encoded_message}"
        
        print(f"Initiating call from {twilio_phone} to {lead['phone']} with webhook: {voice_webhook_url}")
        
        # Initiate call to the LEAD first, which will then connect to agent
        call = client.calls.create(
            to=lead["phone"],
            from_=twilio_phone,
            url=voice_webhook_url,
            method='GET'
        )
        
        # Log the call activity
        current_notes = lead.get('notes', '')
        new_note = f"\n\n[Call] Initiated voice bridge call - Agent: {twilio_phone} → Lead: {lead['phone']} - {datetime.now().isoformat()}"
        await db.leads.update_one(
            {"id": call_data.lead_id},
            {"$set": {"notes": current_notes + new_note}}
        )
        
        return {
            "status": "success",
            "call_sid": call.sid,
            "message": f"Voice bridge call initiated. The lead will receive a call and then be connected to you.",
            "details": {
                "lead_phone": lead["phone"],
                "agent_phone": twilio_phone,
                "call_flow": "Lead receives call → Hears message → Connected to agent"
            }
        }
        
    except Exception as e:
        print(f"Call initiation error: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/twilio/sms")
async def send_sms(sms_data: TwilioSMSRequest):
    """Send SMS via Twilio"""
    try:
        # Get lead details
        lead = await db.leads.find_one({"id": sms_data.lead_id})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Get Twilio client
        client = await get_twilio_client(lead["user_id"])
        if not client:
            raise HTTPException(status_code=400, detail="Twilio not configured")
        
        # Get user's Twilio settings
        settings = await db.settings.find_one({"user_id": lead["user_id"]})
        twilio_phone = settings.get("twilio_phone_number")
        
        if not twilio_phone:
            raise HTTPException(status_code=400, detail="Twilio phone number not configured")
        
        if not lead.get("phone"):
            raise HTTPException(status_code=400, detail="Lead has no phone number")
        
        # Send SMS using synchronous client
        message = client.messages.create(
            body=sms_data.message,
            from_=twilio_phone,
            to=lead["phone"]
        )
        
        # Log the SMS activity
        await db.leads.update_one(
            {"id": sms_data.lead_id},
            {"$set": {"notes": f"{lead.get('notes', '')}\n\n[SMS] Sent: '{sms_data.message}' - {datetime.now().isoformat()}"}}
        )
        
        return {
            "status": "success",
            "message_sid": message.sid,
            "message": f"SMS sent to {lead['phone']}"
        }
        
    except Exception as e:
        print(f"SMS sending error: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/twilio/whatsapp")
async def send_whatsapp(whatsapp_data: TwilioWhatsAppRequest):
    """Send WhatsApp message via Twilio"""
    try:
        # Get lead details
        lead = await db.leads.find_one({"id": whatsapp_data.lead_id})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        # Get Twilio client
        client = await get_twilio_client(lead["user_id"])
        if not client:
            raise HTTPException(status_code=400, detail="Twilio not configured")
        
        # Get user's Twilio settings
        settings = await db.settings.find_one({"user_id": lead["user_id"]})
        twilio_whatsapp = settings.get("twilio_whatsapp_number")
        
        if not twilio_whatsapp:
            raise HTTPException(status_code=400, detail="Twilio WhatsApp number not configured")
        
        if not lead.get("phone"):
            raise HTTPException(status_code=400, detail="Lead has no phone number")
        
        # Send WhatsApp message using synchronous client
        message = client.messages.create(
            body=whatsapp_data.message,
            from_=f"whatsapp:{twilio_whatsapp}",
            to=f"whatsapp:{lead['phone']}"
        )
        
        # Log the WhatsApp activity
        await db.leads.update_one(
            {"id": whatsapp_data.lead_id},
            {"$set": {"notes": f"{lead.get('notes', '')}\n\n[WhatsApp] Sent: '{whatsapp_data.message}' - {datetime.now().isoformat()}"}}
        )
        
        return {
            "status": "success",
            "message_sid": message.sid,
            "message": f"WhatsApp sent to {lead['phone']}"
        }
        
    except Exception as e:
        print(f"WhatsApp sending error: {e}")
        return {"status": "error", "message": str(e)}

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
    webhook_enabled: Optional[bool] = None
    facebook_webhook_verify_token: Optional[str] = None
    generic_webhook_enabled: Optional[bool] = None
    api_key: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    twilio_whatsapp_number: Optional[str] = None
    twilio_api_key: Optional[str] = None
    twilio_api_secret: Optional[str] = None
    smtp_protocol: Optional[str] = None
    smtp_hostname: Optional[str] = None
    smtp_port: Optional[str] = None
    smtp_ssl_tls: Optional[bool] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_from_name: Optional[str] = None

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

@app.post("/api/ai/chat")
async def chat(payload: dict):
    try:
        from emergentintegrations import EmergentLLM
        llm = EmergentLLM(api_key=os.environ.get('EMERGENT_LLM_KEY'))
        
        messages = payload.get('messages', [])
        stream = payload.get('stream', False)
        
        if stream:
            return StreamingResponse(
                llm.stream_chat(messages=messages),
                media_type="text/plain"
            )
        else:
            response = await llm.chat(messages=messages)
            return {"response": response}
    except Exception as e:
        return {"error": str(e), "fallback": "Chat service temporarily unavailable"}

# --- Webhook Endpoints ---

class FacebookLeadWebhook(BaseModel):
    object: str
    entry: List[Dict[str, Any]]

class GenericLeadWebhook(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None  # Added for compatibility
    email: Optional[str] = None
    phone: Optional[str] = None
    property_type: Optional[str] = None
    neighborhood: Optional[str] = None
    location: Optional[str] = None  # Added for compatibility
    budget: Optional[Union[str, int, float]] = None  # Accept string, int, or float
    source: Optional[str] = None
    lead_source: Optional[str] = None  # Added for compatibility
    timestamp: Optional[str] = None  # Added for compatibility
    custom_fields: Optional[Dict[str, Any]] = None

@app.get("/api/webhooks/facebook-leads/{user_id}")
async def facebook_webhook_verification(user_id: str, request: Request):
    """Facebook webhook verification endpoint"""
    query_params = dict(request.query_params)
    mode = query_params.get('hub.mode')
    token = query_params.get('hub.verify_token')
    challenge = query_params.get('hub.challenge')
    
    # Get user's verify token from settings
    settings_doc = await db.settings.find_one({"user_id": user_id})
    if not settings_doc or not settings_doc.get('webhook_enabled'):
        raise HTTPException(status_code=404, detail="Webhook not enabled for this user")
    
    expected_token = settings_doc.get('facebook_webhook_verify_token')
    
    if mode == 'subscribe' and token == expected_token:
        return int(challenge)
    else:
        raise HTTPException(status_code=403, detail="Verification failed")

@app.post("/api/webhooks/facebook-leads/{user_id}")
async def facebook_webhook_handler(user_id: str, webhook_data: FacebookLeadWebhook):
    """Handle Facebook Lead Ads webhook"""
    try:
        # Verify user has webhook enabled
        settings_doc = await db.settings.find_one({"user_id": user_id})
        if not settings_doc or not settings_doc.get('webhook_enabled'):
            raise HTTPException(status_code=404, detail="Webhook not enabled")
        
        leads_created = []
        
        for entry in webhook_data.entry:
            if 'changes' in entry:
                for change in entry['changes']:
                    if change.get('field') == 'leadgen':
                        lead_data = change.get('value', {})
                        
                        # Extract lead information from Facebook webhook
                        form_data = {}
                        if 'form' in lead_data and 'leadgen_id' in lead_data:
                            # In a real implementation, you'd call Facebook API to get full lead details
                            # For now, we'll use the basic data structure
                            field_data = lead_data.get('field_data', [])
                            
                            for field in field_data:
                                field_name = field.get('name', '').lower()
                                field_value = field.get('values', [''])[0]
                                
                                if field_name in ['first_name', 'full_name']:
                                    form_data['first_name'] = field_value
                                elif field_name == 'last_name':
                                    form_data['last_name'] = field_value  
                                elif field_name in ['email', 'email_address']:
                                    form_data['email'] = field_value
                                elif field_name in ['phone', 'phone_number']:
                                    form_data['phone'] = field_value
                                elif field_name in ['property_type', 'looking_for']:
                                    form_data['property_type'] = field_value
                                elif field_name in ['location', 'city', 'area']:
                                    form_data['neighborhood'] = field_value
                        
                        # Create lead
                        if form_data:
                            # Normalize phone number
                            normalized_phone = normalize_phone(form_data.get('phone'))
                            
                            lead = Lead(
                                user_id=user_id,
                                name=f"{form_data.get('first_name', '')} {form_data.get('last_name', '')}".strip() or "Facebook Lead",
                                first_name=form_data.get('first_name'),
                                last_name=form_data.get('last_name'),
                                email=form_data.get('email'),
                                phone=normalized_phone,
                                property_type=form_data.get('property_type'),
                                neighborhood=form_data.get('neighborhood'),
                                source_tags=["Facebook Lead Ads"],
                                stage="New",
                                in_dashboard=True,  # Auto-add to dashboard for immediate attention
                                priority="medium"
                            )
                            
                            await db.leads.insert_one(lead.model_dump(exclude_none=True))
                            leads_created.append(lead)
        
        return {"status": "success", "leads_created": len(leads_created)}
        
    except Exception as e:
        print(f"Facebook webhook error: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/api/webhooks/stats/{user_id}")
async def get_webhook_stats(user_id: str):
    """Get webhook activity statistics"""
    try:
        # Get current time for 24h calculations
        now = datetime.now()
        yesterday = now - timedelta(days=1)
        
        # Count leads from generic webhook (source_tags contains "Generic Webhook" or specific sources)
        generic_total = await db.leads.count_documents({
            "user_id": user_id,
            "$or": [
                {"source_tags": {"$in": ["Generic Webhook"]}},
                {"source_tags": {"$in": ["google_form", "zapier", "make", "custom"]}}
            ]
        })
        
        generic_24h = await db.leads.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": yesterday.isoformat()},
            "$or": [
                {"source_tags": {"$in": ["Generic Webhook"]}},
                {"source_tags": {"$in": ["google_form", "zapier", "make", "custom"]}}
            ]
        })
        
        # Get last activity for generic webhook
        generic_last = await db.leads.find_one({
            "user_id": user_id,
            "$or": [
                {"source_tags": {"$in": ["Generic Webhook"]}},
                {"source_tags": {"$in": ["google_form", "zapier", "make", "custom"]}}
            ]
        }, sort=[("created_at", -1)])
        
        # Count leads from Facebook webhook
        facebook_total = await db.leads.count_documents({
            "user_id": user_id,
            "source_tags": {"$in": ["Facebook Lead Ads", "facebook", "instagram"]}
        })
        
        facebook_24h = await db.leads.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": yesterday.isoformat()},
            "source_tags": {"$in": ["Facebook Lead Ads", "facebook", "instagram"]}
        })
        
        # Get last activity for Facebook webhook
        facebook_last = await db.leads.find_one({
            "user_id": user_id,
            "source_tags": {"$in": ["Facebook Lead Ads", "facebook", "instagram"]}
        }, sort=[("created_at", -1)])
        
        return {
            "generic": {
                "total": generic_total,
                "last_24h": generic_24h,
                "last_activity": generic_last.get("created_at") if generic_last else None,
                "status": "active" if generic_24h > 0 else "inactive"
            },
            "facebook": {
                "total": facebook_total,
                "last_24h": facebook_24h,
                "last_activity": facebook_last.get("created_at") if facebook_last else None,
                "status": "active" if facebook_24h > 0 else "inactive"
            }
        }
        
    except Exception as e:
        print(f"Webhook stats error: {e}")
        return {
            "generic": {"total": 0, "last_24h": 0, "last_activity": None, "status": "inactive"},
            "facebook": {"total": 0, "last_24h": 0, "last_activity": None, "status": "inactive"}
        }

@app.post("/api/webhooks/generic-leads/{user_id}")
async def generic_webhook_handler(user_id: str, lead_data: GenericLeadWebhook):
    """Handle generic webhook for lead collection"""
    try:
        print(f"Generic webhook received for user {user_id}: {lead_data}")
        
        # Verify user has generic webhook enabled
        settings_doc = await db.settings.find_one({"user_id": user_id})
        if not settings_doc or not settings_doc.get('generic_webhook_enabled'):
            print(f"Generic webhook not enabled for user {user_id}")
            raise HTTPException(status_code=404, detail="Generic webhook not enabled")
        
        # Handle name fields - prioritize full_name, then first_name/last_name
        first_name = lead_data.first_name
        last_name = lead_data.last_name
        
        if lead_data.full_name and not first_name and not last_name:
            # Split full name if provided and individual names are missing
            name_parts = lead_data.full_name.split(' ', 1)
            first_name = name_parts[0] if len(name_parts) > 0 else None
            last_name = name_parts[1] if len(name_parts) > 1 else None
        
        # Handle location fields - prioritize location, then neighborhood
        location = lead_data.neighborhood or lead_data.location
        
        # Handle source fields - prioritize lead_source, then source
        source = lead_data.lead_source or lead_data.source or "Generic Webhook"
        
        # Normalize phone number  
        normalized_phone = normalize_phone(lead_data.phone)
        print(f"Phone normalized from '{lead_data.phone}' to '{normalized_phone}'")
        
        # Parse budget if provided - handle both string and numeric formats
        price_min = None
        price_max = None
        if lead_data.budget:
            if isinstance(lead_data.budget, (int, float)):
                # If budget is a number, use it as max price
                price_max = int(lead_data.budget)
                print(f"Budget {lead_data.budget} set as max price: {price_max}")
            else:
                # If budget is a string, parse it for ranges
                budget_str = str(lead_data.budget).replace(',', '').replace('$', '').replace('k', '000').replace('K', '000')
                price_match = re.findall(r'\d+', budget_str)
                if len(price_match) >= 2:
                    price_min = int(price_match[0])
                    price_max = int(price_match[1])
                elif len(price_match) == 1:
                    price_max = int(price_match[0])
                print(f"Budget parsed: min={price_min}, max={price_max}")
        
        lead = Lead(
            user_id=user_id,
            name=f"{first_name or ''} {last_name or ''}".strip() or "Generic Lead",
            first_name=first_name,
            last_name=last_name,
            email=lead_data.email,
            phone=normalized_phone,
            property_type=lead_data.property_type,
            neighborhood=location,
            price_min=price_min,
            price_max=price_max,
            source_tags=[source],
            stage="New",
            in_dashboard=True,  # Auto-add to dashboard
            priority="medium",
            notes=f"Timestamp: {lead_data.timestamp}, Custom fields: {lead_data.custom_fields}" if lead_data.timestamp or lead_data.custom_fields else None
        )
        
        print(f"Creating lead: {lead.name} - {lead.email} - {lead.phone}")
        await db.leads.insert_one(lead.model_dump(exclude_none=True))
        print(f"Lead created successfully with ID: {lead.id}")
        
        return {"status": "success", "lead_id": lead.id, "message": "Lead created successfully"}
        
    except Exception as e:
        print(f"Generic webhook error: {e}")
        return {"status": "error", "message": str(e)}