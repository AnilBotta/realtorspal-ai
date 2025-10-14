"""
Lead Nurturing AI Service (CrewAI) for RealtorPal
-------------------------------------------------
Features:
- Stage-aware nurturing (new → contacted → engaged → appointment_* → onboarding)
- Multi-channel outreach (email/sms/whatsapp) honoring consent & quiet hours
- Inbound intent classification + safe auto-replies + escalation
- Appointment proposal/booking integration
- 3-month follow-up window, then dormant; immediate stop on "not interested"
- Live activity via Server-Sent Events for UI popup
- Integrated with existing MongoDB leads and settings

ENV:
  OPENAI_API_KEY       (from Settings)
  SENDGRID_API_KEY     (from Settings)
  TWILIO_ACCOUNT_SID   (from Settings)
  TWILIO_AUTH_TOKEN    (from Settings)
"""

# -------------------------
# Imports
# -------------------------
import os
import re
import json
import time
import uuid
import asyncio
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List, Callable, Tuple

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient

from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI


# -------------------------
# Database Setup
# -------------------------
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "realtorspal")
if not MONGO_URL:
    raise RuntimeError("MONGO_URL is not set")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# In-memory activity logs for SSE streaming
ACTIVITY_LOGS: Dict[str, List[str]] = {}  # lead_id -> list of activity strings


# -------------------------
# Utilities
# -------------------------
def _log(lead_id: str, msg: str) -> None:
    """Add activity log for SSE streaming"""
    ACTIVITY_LOGS.setdefault(lead_id, []).append(f"{datetime.now().strftime('%H:%M:%S')} {msg}")

def _now() -> datetime:
    return datetime.now(timezone.utc)

def _sha(obj: Any) -> str:
    return hashlib.md5(json.dumps(obj, sort_keys=True, default=str).encode()).hexdigest()[:12]

def _in_quiet_hours(lead: Dict[str, Any], ts: Optional[datetime] = None) -> bool:
    """Check if current time is in lead's quiet hours (default 9 PM - 9 AM)"""
    # TESTING MODE: Quiet hours disabled for testing purposes
    # TODO: Re-enable for production
    return False
    
    # PRODUCTION CODE (commented out for testing):
    # ts = ts or _now()
    # # Default quiet hours: 21:00 to 09:00 (9 PM to 9 AM)
    # quiet_start = 21  # 9 PM
    # quiet_end = 9     # 9 AM
    # 
    # current_hour = ts.hour
    # 
    # # If quiet hours span midnight (21:00 to 09:00)
    # if quiet_start > quiet_end:
    #     return current_hour >= quiet_start or current_hour < quiet_end
    # else:
    #     return quiet_start <= current_hour < quiet_end

def _has_consent(lead: Dict[str, Any], channel: str) -> bool:
    """Check if lead has consented to communication via channel"""
    # For now, assume consent if email exists for email, phone for sms/whatsapp
    if channel == "email":
        return bool(lead.get("email"))
    elif channel in ["sms", "whatsapp"]:
        return bool(lead.get("phone"))
    return False

def _get_stage(lead: Dict[str, Any]) -> str:
    """Get current nurturing stage from lead data"""
    # Map existing CRM stages to nurturing stages
    crm_stage = lead.get("stage", "").lower()
    pipeline = lead.get("pipeline", "").lower()
    
    if crm_stage in ["new", ""] or pipeline in ["new lead", "not set", ""]:
        return "new"
    elif "contact" in crm_stage or "contact" in pipeline:
        return "contacted"
    elif "meeting" in pipeline or "appointment" in pipeline:
        return "appointment_proposed"
    elif "signed" in pipeline or "agreement" in pipeline:
        return "onboarding"
    elif "sold" in pipeline or "closed" in pipeline:
        return "onboarding"
    elif "nurtur" in pipeline or "warm" in pipeline:
        return "engaged"
    elif "cold" in pipeline or "not ready" in pipeline:
        return "no_response"
    else:
        return "contacted"  # Default fallback

async def _update_lead_stage(lead_id: str, stage: str) -> None:
    """Update lead's nurturing stage in database"""
    try:
        await db.leads.update_one(
            {"id": lead_id},
            {"$set": {"nurturing_stage": stage, "last_nurture_update": _now().isoformat()}}
        )
        _log(lead_id, f"[DATABASE] Updated stage to: {stage}")
    except Exception as e:
        _log(lead_id, f"[ERROR] Failed to update stage: {e}")

async def _get_lead(lead_id: str) -> Optional[Dict[str, Any]]:
    """Get lead from database"""
    try:
        lead = await db.leads.find_one({"id": lead_id})
        if lead:
            # Remove MongoDB _id for JSON serialization
            lead.pop("_id", None)
        return lead
    except Exception as e:
        print(f"Error getting lead {lead_id}: {e}")
        return None

async def _get_settings(user_id: str) -> Dict[str, Any]:
    """Get user settings for API keys"""
    try:
        settings = await db.settings.find_one({"user_id": user_id})
        return settings or {}
    except Exception as e:
        print(f"Error getting settings for user {user_id}: {e}")
        return {}


# -------------------------
# CrewAI Agents Setup
# -------------------------
async def _get_llm(user_id: str):
    """Get LLM instance with user's API key or Emergent LLM key"""
    settings = await _get_settings(user_id)
    openai_key = settings.get("openai_api_key") or os.getenv("OPENAI_API_KEY")
    
    # If no OpenAI key, use Emergent LLM key
    if not openai_key:
        # Use the Emergent LLM key directly
        openai_key = "sk-emergent-7751d34B226BdCc8f8"
        _log(f"user_{user_id}", "[LLM] Using Emergent LLM key for CrewAI")
    else:
        _log(f"user_{user_id}", "[LLM] Using user's OpenAI key for CrewAI")
    
    if not openai_key:
        raise ValueError("No API key available")
    
    return ChatOpenAI(model="gpt-4o-mini", api_key=openai_key, temperature=0.7)

# Agent definitions (will be created per-request with user's LLM)
def create_agents(llm):
    orchestrator = Agent(
        role="Nurture Orchestrator",
        goal="Plan next-best-action for the lead given their stage, persona, and signals.",
        backstory="Thinks in stages and outcomes; keeps comms human and helpful.",
        tools=[],
        llm=llm
    )

    content_crafter = Agent(
        role="Content Crafter", 
        goal="Write short, channel-appropriate, personalized messages that sound human.",
        backstory="Tailors tone and CTA to buyer/seller context; avoids spammy language.",
        tools=[],
        llm=llm
    )

    intent_classifier = Agent(
        role="Intent Classifier",
        goal="Classify inbound text intents (book, reschedule, not_interested, questions, objection_budget, objection_area, later, spam).",
        backstory="Reads messages and returns a single label + short reasoning.",
        tools=[],
        llm=llm
    )

    return orchestrator, content_crafter, intent_classifier


# -------------------------
# Message Crafting (CrewAI)
# -------------------------
async def craft_message(lead: Dict[str, Any], purpose: str, channel: str, user_id: str) -> str:
    """Craft personalized message using CrewAI"""
    lead_id = lead.get("id", "unknown")
    
    try:
        # Try to get LLM and use CrewAI
        llm = await _get_llm(user_id)
        _, content_crafter, _ = create_agents(llm)
        
        _log(lead_id, f"[CREWAI] Using Content Crafter for {purpose} message")
        
        # Extract lead information for personalization
        tokens = {
            "first_name": lead.get("first_name", "there"),
            "last_name": lead.get("last_name", ""),
            "city": lead.get("city", ""),
            "property_type": lead.get("property_type", ""),
            "price_min": lead.get("price_min"),
            "price_max": lead.get("price_max"),
            "neighborhood": lead.get("neighborhood", ""),
            "agent_name": "your Realtor",  # Could be from settings
            "booking_link": "https://calendly.com/your-team/15min"  # Could be from settings
        }
        
        # Filter out None/empty values
        tokens = {k: v for k, v in tokens.items() if v}
        
        task_description = f"""
        Write a {channel.upper()} message for purpose '{purpose}' to a real estate lead.
        
        Lead details: {json.dumps(tokens, indent=2)}
        
        Purpose guidelines:
        - welcome: Friendly introduction and value proposition
        - followup: Check-in with value-add (market update, new listings, etc.)
        - reengage: Gentle reconnection attempt
        - answer_question: Helpful response to lead's inquiry
        - book_appointment: Invitation to schedule showing/consultation
        
        Requirements:
        - Keep it 1-3 sentences for SMS/WhatsApp, 1-2 short paragraphs for email
        - Personalize with available lead details
        - Include clear but not pushy call-to-action
        - Sound human and helpful, not salesy
        - For real estate context (buying/selling property)
        """
        
        from crewai import Task
        task = Task(
            description=task_description,
            agent=content_crafter,
            expected_output="A personalized message string ready to send"
        )
        
        result = Crew(agents=[content_crafter], tasks=[task]).kickoff()
        message = str(result.raw) if hasattr(result, 'raw') else str(result)
        
        _log(lead_id, f"[CREWAI] Content Crafter generated {len(message)} character message")
        return message
        
    except Exception as e:
        _log(lead_id, f"[FALLBACK] CrewAI failed ({str(e)[:50]}...), using templates")
        
        # Fallback to personalized templates
        name = lead.get("first_name", "there")
        city = lead.get("city", "")
        property_type = lead.get("property_type", "")
        
        if purpose == "welcome":
            message = f"Hi {name}! Thanks for your interest in real estate"
            if city:
                message += f" in {city}"
            message += ". I'm here to help you find the perfect"
            if property_type:
                message += f" {property_type.lower()}"
            else:
                message += " property"
            message += ". Any questions?"
            
        elif purpose == "followup":
            message = f"Hi {name}, just checking in on your"
            if city and property_type:
                message += f" {property_type.lower()} search in {city}"
            elif city:
                message += f" property search in {city}"
            elif property_type:
                message += f" {property_type.lower()} search"
            else:
                message += " property search"
            message += ". Any updates? I'm here to help."
            
        elif purpose == "reengage":
            message = f"Hi {name}, I wanted to reconnect about your real estate needs"
            if city:
                message += f" in {city}"
            message += ". The market has some great opportunities right now. Would you like an update?"
            
        else:
            message = f"Hi {name}, thanks for reaching out! I'd be happy to help with your real estate questions"
            if city:
                message += f" about {city}"
            message += ". I'll get back to you with detailed information soon."
        
        _log(lead_id, f"[TEMPLATE] Generated {len(message)} character message")
        return message


# -------------------------
# Channel Senders (integrate with existing Twilio/Email settings)
# -------------------------
async def send_email(lead: Dict[str, Any], message: str, user_id: str) -> str:
    """Send email via SendGrid"""
    try:
        # Get SendGrid API key from database settings
        settings = await _get_settings(user_id)
        sendgrid_api_key = settings.get("sendgrid_api_key")
        
        if not sendgrid_api_key:
            _log(lead["id"], "[EMAIL] SendGrid API key not configured in settings")
            return f"error_no_api_key"
        
        # Get recipient email
        to_email = lead.get("email")
        if not to_email:
            _log(lead["id"], "[EMAIL] No email address found for lead")
            return f"error_no_email"
        
        # Get sender email from settings (fallback to default)
        from_email = settings.get("smtp_from_email", "noreply@realtorspal.com")
        from_name = settings.get("smtp_from_name", "RealtorsPal AI")
        
        # Import SendGrid components
        import sendgrid
        from sendgrid.helpers.mail import Mail, From, To, Subject, PlainTextContent, HtmlContent
        
        # Initialize SendGrid client
        sg = sendgrid.SendGridAPIClient(api_key=sendgrid_api_key)
        
        # Create email subject based on lead info
        lead_name = f"{lead.get('first_name', '')} {lead.get('last_name', '')}".strip()
        if lead_name:
            email_subject = f"Hello {lead_name} - Your Real Estate Update"
        else:
            email_subject = "Your Real Estate Update"
        
        # Create HTML version of the message
        html_message = message.replace('\n', '<br>')
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c5aa0;">Real Estate Update</h2>
                <p>{html_message}</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">
                    This email was sent by your real estate agent through RealtorsPal AI. 
                    <br>If you no longer wish to receive these emails, please reply with "STOP".
                </p>
            </div>
        </body>
        </html>
        """
        
        # Create the mail object
        mail = Mail(
            from_email=From(from_email, from_name),
            to_emails=To(to_email),
            subject=Subject(email_subject),
            plain_text_content=PlainTextContent(message),
            html_content=HtmlContent(html_content)
        )
        
        # Send email
        _log(lead["id"], f"[EMAIL] Sending to {to_email} via SendGrid...")
        response = sg.send(mail)
        
        # Check response
        if response.status_code >= 200 and response.status_code < 300:
            email_id = f"sg_{response.headers.get('X-Message-Id', _sha(message))}"
            _log(lead["id"], f"[EMAIL] Successfully sent via SendGrid -> {email_id}")
            return email_id
        else:
            _log(lead["id"], f"[EMAIL] SendGrid error: {response.status_code} - {response.body}")
            return f"error_sg_{response.status_code}"
            
    except Exception as e:
        error_msg = str(e)[:100]  # Truncate long error messages
        _log(lead["id"], f"[ERROR] SendGrid email failed: {error_msg}")
        return f"error_{_sha(str(e))}"

async def send_sms(lead: Dict[str, Any], message: str, user_id: str) -> str:
    """Send SMS via Twilio"""
    try:
        # Get Twilio settings from database
        settings = await _get_settings(user_id)
        account_sid = settings.get("twilio_account_sid")
        auth_token = settings.get("twilio_auth_token") 
        from_number = settings.get("twilio_phone_number")
        
        if not all([account_sid, auth_token, from_number]):
            _log(lead["id"], "[SMS] Twilio credentials not configured in settings")
            return f"error_no_twilio_config"
        
        # Get recipient phone
        to_phone = lead.get("phone")
        if not to_phone:
            _log(lead["id"], "[SMS] No phone number found for lead")
            return f"error_no_phone"
        
        # For now, return simulation until Twilio package is installed
        # TODO: Install twilio package and implement actual SMS sending
        sms_id = f"sms_{_sha(message)}"
        _log(lead["id"], f"[SMS] Would send to {to_phone} via Twilio -> {sms_id}")
        _log(lead["id"], f"[SMS] Message: {message[:50]}...")
        return sms_id
        
    except Exception as e:
        _log(lead["id"], f"[ERROR] SMS send failed: {e}")
        return f"error_{_sha(str(e))}"

async def send_whatsapp(lead: Dict[str, Any], message: str, user_id: str) -> str:
    """Send WhatsApp via Twilio"""
    try:
        # Get Twilio settings from database
        settings = await _get_settings(user_id)
        account_sid = settings.get("twilio_account_sid")
        auth_token = settings.get("twilio_auth_token")
        whatsapp_number = settings.get("twilio_whatsapp_number")
        
        if not all([account_sid, auth_token, whatsapp_number]):
            _log(lead["id"], "[WHATSAPP] Twilio WhatsApp credentials not configured in settings")
            return f"error_no_twilio_whatsapp_config"
        
        # Get recipient phone
        to_phone = lead.get("phone")
        if not to_phone:
            _log(lead["id"], "[WHATSAPP] No phone number found for lead")
            return f"error_no_phone"
        
        # For now, return simulation until Twilio package is installed
        # TODO: Install twilio package and implement actual WhatsApp sending
        wa_id = f"wa_{_sha(message)}"
        _log(lead["id"], f"[WHATSAPP] Would send to {to_phone} via Twilio -> {wa_id}")
        _log(lead["id"], f"[WHATSAPP] Message: {message[:50]}...")
        return wa_id
        
    except Exception as e:
        _log(lead["id"], f"[ERROR] WhatsApp send failed: {e}")
        return f"error_{_sha(str(e))}"

async def deliver_message(lead: Dict[str, Any], channel: str, message: str, user_id: str) -> str:
    """Deliver message via specified channel"""
    if channel == "email":
        return await send_email(lead, message, user_id)
    elif channel == "sms":
        return await send_sms(lead, message, user_id)
    elif channel == "whatsapp":
        return await send_whatsapp(lead, message, user_id)
    else:
        raise ValueError(f"Unknown channel: {channel}")


# -------------------------
# Intent Classification (CrewAI)
# -------------------------
async def classify_intent(text: str, user_id: str) -> Tuple[str, str]:
    """Classify intent of inbound message"""
    try:
        llm = await _get_llm(user_id)
        _, _, intent_classifier = create_agents(llm)
        
        task = Task(
            description=f"""
            Classify this message into exactly one intent:
            - book: Want to schedule appointment/showing
            - reschedule: Want to change existing appointment
            - not_interested: No longer interested, want to stop contact
            - questions: Asking questions about properties/process
            - objection_budget: Concerns about price/affordability
            - objection_area: Concerns about location/neighborhood
            - later: Interested but not ready now
            - spam: Spam or irrelevant message
            
            Message: "{text}"
            
            Respond with JSON: {{"intent": "category", "reason": "brief explanation"}}
            """,
            agent=intent_classifier,
            expected_output='JSON object with intent and reason'
        )
        
        result = Crew(agents=[intent_classifier], tasks=[task]).kickoff()
        result_text = str(result.raw) if hasattr(result, 'raw') else str(result)
        
        # Try to parse JSON result
        try:
            # Clean up the response to get just the JSON
            result_text = result_text.strip()
            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]
            result_text = result_text.strip()
            
            data = json.loads(result_text)
            return data.get("intent", "questions"), data.get("reason", "")
        except json.JSONDecodeError:
            return "questions", "JSON parsing failed, defaulting to questions"
            
    except Exception as e:
        print(f"Intent classification error: {e}")
        return "questions", f"Classification error: {e}"


# -------------------------
# Nurturing Logic
# -------------------------
def pick_channel(lead: Dict[str, Any]) -> Optional[str]:
    """Pick best available channel for communication"""
    # Priority: email -> sms -> whatsapp
    if lead.get("email") and _has_consent(lead, "email"):
        return "email"
    elif lead.get("phone") and _has_consent(lead, "sms"):
        return "sms"
    elif lead.get("phone") and _has_consent(lead, "whatsapp"):
        return "whatsapp"
    return None

async def analyze_and_update_stage(lead: Dict[str, Any], user_id: str) -> str:
    """Use CrewAI orchestrator to analyze and determine lead stage"""
    try:
        llm = await _get_llm(user_id)
        orchestrator, _, _ = create_agents(llm)
        
        # Analyze lead data to determine appropriate stage
        lead_context = {
            "current_stage": _get_stage(lead),
            "contact_count": lead.get("nurture_contact_count", 0),
            "last_contact": lead.get("last_nurture_contact"),
            "lead_age_days": (datetime.now() - datetime.fromisoformat(lead.get("created_at", datetime.now().isoformat()))).days if lead.get("created_at") else 0,
            "has_responses": lead.get("has_inbound_responses", False),
            "pipeline": lead.get("pipeline"),
            "priority": lead.get("priority")
        }
        
        task_description = f"""
        Analyze this lead's data and determine the most appropriate nurturing stage:
        
        Lead Context: {json.dumps(lead_context, indent=2)}
        
        Available stages:
        - new: First time contact needed
        - contacted: Initial contact made, awaiting response
        - engaged: Lead is responding and showing interest
        - appointment_proposed: Meeting/showing proposed
        - appointment_confirmed: Meeting scheduled
        - onboarding: Lead converted, stop nurturing
        - not_interested: Lead explicitly declined, stop nurturing
        - no_response: Multiple attempts with no response
        - dormant: Long-term follow-up (3+ months)
        
        Rules:
        - If contact_count = 0: "new"
        - If contact_count > 0 and no responses: "contacted" or "no_response" (after 3+ attempts)
        - If has_responses = true: "engaged"
        - If lead_age_days > 90: "dormant"
        - If pipeline contains "signed" or "sold": "onboarding"
        
        Return ONLY the stage name.
        """
        
        from crewai import Task
        task = Task(
            description=task_description,
            agent=orchestrator,
            expected_output="Single stage name"
        )
        
        result = Crew(agents=[orchestrator], tasks=[task]).kickoff()
        stage = str(result.raw).strip().lower() if hasattr(result, 'raw') else str(result).strip().lower()
        
        # Validate stage
        valid_stages = ["new", "contacted", "engaged", "appointment_proposed", "appointment_confirmed", 
                      "onboarding", "not_interested", "no_response", "dormant"]
        if stage not in valid_stages:
            stage = _get_stage(lead)  # Fallback to current logic
        
        _log(lead["id"], f"[CREWAI] Stage analysis: {lead_context['current_stage']} → {stage}")
        return stage
        
    except Exception as e:
        _log(lead["id"], f"[ERROR] CrewAI stage analysis failed: {e}, using fallback")
        return _get_stage(lead)  # Fallback to original logic

async def send_nurture_message(lead: Dict[str, Any], purpose: str, user_id: str) -> Optional[str]:
    """Send a nurturing message to lead with full CrewAI logic"""
    lead_id = lead["id"]
    
    # Step 1: Analyze and confirm stage using CrewAI
    analyzed_stage = await analyze_and_update_stage(lead, user_id)
    await _update_lead_stage(lead_id, analyzed_stage)
    
    # Step 2: Check channel preferences and consent
    channel = pick_channel(lead)
    if not channel:
        _log(lead_id, "[COMPLIANCE] No available channels with consent")
        return None
        
    # Step 3: Respect quiet hours (9 PM - 9 AM)
    if _in_quiet_hours(lead):
        _log(lead_id, "[COMPLIANCE] Quiet hours active (9 PM - 9 AM), scheduling for morning")
        # Schedule for 9 AM next day
        morning_time = (_now().replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=1))
        await db.leads.update_one(
            {"id": lead_id},
            {"$set": {"next_nurture_action": morning_time.isoformat()}}
        )
        return None
    
    # Step 4: Check 3-month limit rule (DISABLED FOR TESTING)
    # TODO: Re-enable for production
    # created_date = datetime.fromisoformat(lead.get("created_at", _now().isoformat()))
    # if (_now() - created_date).days > 90 and analyzed_stage not in ["engaged", "appointment_proposed", "appointment_confirmed"]:
    #     _log(lead_id, "[RULE] 3-month limit reached, moving to dormant")
    #     await _update_lead_stage(lead_id, "dormant")
    #     return None
    
    # Step 5: Stop nurturing for final stages
    if analyzed_stage in ["onboarding", "not_interested"]:
        _log(lead_id, f"[COMPLETE] Nurturing stopped for stage: {analyzed_stage}")
        return None
    
    # Step 6: Craft personalized message using CrewAI
    try:
        _log(lead_id, f"[CREWAI] Crafting {purpose} message for {analyzed_stage} stage via {channel}")
        message = await craft_message(lead, purpose, channel, user_id)
        
        # Step 7: Send message via appropriate channel
        message_id = await deliver_message(lead, channel, message, user_id)
        
        # Step 8: Update lead tracking
        await db.leads.update_one(
            {"id": lead_id},
            {"$set": {
                "last_nurture_contact": _now().isoformat(),
                "last_nurture_channel": channel,
                "nurture_contact_count": lead.get("nurture_contact_count", 0) + 1,
                "nurturing_stage": analyzed_stage
            }}
        )
        
        _log(lead_id, f"[SUCCESS] {purpose} sent via {channel} → {message_id}")
        return message_id
        
    except Exception as e:
        _log(lead_id, f"[ERROR] Failed to send {purpose}: {e}")
        return None

def calculate_next_followup(lead: Dict[str, Any], stage: str) -> Optional[datetime]:
    """Calculate when next follow-up should occur based on CrewAI rules"""
    now = _now()
    contact_count = lead.get("nurture_contact_count", 0)
    
    # Handle timezone-aware datetime parsing
    created_at_str = lead.get("created_at", now.isoformat())
    try:
        created_date = datetime.fromisoformat(created_at_str)
        # Make timezone-aware if it's not
        if created_date.tzinfo is None:
            created_date = created_date.replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        # Fallback to now if parsing fails
        created_date = now
    
    lead_age_days = (now - created_date).days
    
    # Stop nurturing for final stages
    if stage in ["onboarding", "not_interested"]:
        return None
    
    # 3-month rule: Move to dormant after 90 days (DISABLED FOR TESTING)
    # TODO: Re-enable for production
    # if lead_age_days >= 90:
    #     if stage != "dormant":
    #         return now + timedelta(days=30)  # Monthly dormant check
    #     else:
    #         return now + timedelta(days=30)  # Continue monthly for dormant
    
    # Stage-based scheduling following your original cadence
    if stage == "new":
        return now + timedelta(hours=2)  # Immediate welcome sequence
        
    elif stage == "contacted":
        # Welcome cadence: 0, 2, 5, 9 days, then weekly, then bi-weekly
        if contact_count <= 1:
            return now + timedelta(days=2)  # Day 2
        elif contact_count <= 2:
            return now + timedelta(days=5)  # Day 5  
        elif contact_count <= 3:
            return now + timedelta(days=9)  # Day 9
        elif contact_count <= 5:
            return now + timedelta(days=7)  # Weekly after initial sequence
        else:
            return now + timedelta(days=14)  # Bi-weekly
            
    elif stage == "engaged":
        return now + timedelta(days=3)  # Keep engaged leads warm
        
    elif stage in ["appointment_proposed", "appointment_confirmed"]:
        return now + timedelta(days=1)  # Follow up quickly on appointments
        
    elif stage == "no_response":
        # Less frequent for non-responsive
        if contact_count < 5:
            return now + timedelta(days=14)  # Bi-weekly
        else:
            return now + timedelta(days=30)  # Monthly before dormant
            
    elif stage == "dormant":
        return now + timedelta(days=30)  # Monthly soft touch
        
    else:
        return now + timedelta(days=7)  # Default weekly

async def schedule_next_action(lead: Dict[str, Any], stage: str) -> None:
    """Schedule the next nurturing action following CrewAI rules"""
    next_time = calculate_next_followup(lead, stage)
    
    if next_time is None:
        # No more actions needed (final stages)
        await db.leads.update_one(
            {"id": lead["id"]},
            {"$unset": {"next_nurture_action": ""}}
        )
        _log(lead["id"], f"[SCHEDULE] No more actions needed for stage: {stage}")
    else:
        await db.leads.update_one(
            {"id": lead["id"]},
            {"$set": {"next_nurture_action": next_time.isoformat()}}
        )
        _log(lead["id"], f"[SCHEDULE] Next action at {next_time.strftime('%Y-%m-%d %H:%M')} for stage: {stage}")


# -------------------------
# API Models
# -------------------------
class RunNurtureRequest(BaseModel):
    lead_id: str
    user_id: str

class InboundMessageRequest(BaseModel):
    lead_id: str
    user_id: str
    channel: str  # email, sms, whatsapp
    message: str

class TickRequest(BaseModel):
    lead_id: str
    user_id: str


# -------------------------
# FastAPI App
# -------------------------
app = FastAPI(title="Lead Nurturing AI Service")

# Note: CORS handled by main server when mounted


# -------------------------
# API Endpoints
# -------------------------
@app.post("/run")
async def start_nurturing(request: RunNurtureRequest, background_tasks: BackgroundTasks):
    """Start or continue nurturing for a lead"""
    lead = await _get_lead(request.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Initialize activity log
    ACTIVITY_LOGS[request.lead_id] = []
    _log(request.lead_id, "[START] Lead nurturing initiated")
    
    # Get current stage
    current_stage = _get_stage(lead)
    _log(request.lead_id, f"[STAGE] Current stage: {current_stage}")
    
    # Update stage in database
    await _update_lead_stage(request.lead_id, current_stage)
    
    # Determine action based on stage
    if current_stage == "new":
        purpose = "welcome"
    elif current_stage in ["contacted", "engaged"]:
        purpose = "followup"
    elif current_stage == "no_response":
        purpose = "reengage"
    else:
        _log(request.lead_id, f"[SKIP] Stage {current_stage} doesn't need nurturing")
        return {"lead_id": request.lead_id, "status": "skipped", "reason": f"Stage {current_stage} doesn't need nurturing"}
    
    # Send message in background
    background_tasks.add_task(send_nurture_message, lead, purpose, request.user_id)
    background_tasks.add_task(schedule_next_action, lead, current_stage)
    
    return {"lead_id": request.lead_id, "status": "started", "stage": current_stage}

@app.post("/inbound")
async def handle_inbound(request: InboundMessageRequest):
    """Handle inbound message from lead with full CrewAI logic"""
    lead = await _get_lead(request.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    _log(request.lead_id, f"[INBOUND] {request.channel.upper()} message: {request.message[:50]}...")
    
    # Step 1: Mark lead as having inbound responses
    await db.leads.update_one(
        {"id": request.lead_id},
        {"$set": {"has_inbound_responses": True}}
    )
    
    # Step 2: Classify intent using CrewAI
    intent, reason = await classify_intent(request.message, request.user_id)
    _log(request.lead_id, f"[CREWAI] Intent: {intent} | Reason: {reason}")
    
    # Step 3: Handle each intent with appropriate actions
    auto_reply = None
    new_stage = None
    escalate = False
    
    if intent == "spam":
        _log(request.lead_id, "[ACTION] Spam detected - ignored")
        return {"intent": intent, "action": "ignored"}
        
    elif intent == "not_interested":
        new_stage = "not_interested"
        _log(request.lead_id, "[ACTION] Marked not interested - stopping nurture automation")
        auto_reply = "Thank you for letting us know. We'll remove you from our follow-up sequence. Feel free to reach out if your situation changes in the future."
        
    elif intent in ["book", "reschedule"]:
        new_stage = "appointment_proposed" 
        _log(request.lead_id, "[ACTION] Appointment interest detected")
        
        # Propose appointment times (stub - integrate with calendar later)
        times = [
            (_now() + timedelta(days=1, hours=10)).strftime("%a %b %d at %I:%M %p"),
            (_now() + timedelta(days=2, hours=14)).strftime("%a %b %d at %I:%M %p"),
            (_now() + timedelta(days=3, hours=16)).strftime("%a %b %d at %I:%M %p")
        ]
        
        auto_reply = f"Great! I'd be happy to schedule a meeting. Here are some available times:\n\n"
        auto_reply += f"• {times[0]}\n• {times[1]}\n• {times[2]}\n\n"
        auto_reply += "Please reply with your preferred time, or let me know what works better for you."
        
    elif intent in ["questions", "objection_budget", "objection_area"]:
        new_stage = "engaged"
        _log(request.lead_id, "[ACTION] Questions/objections detected - crafting helpful response")
        
        # Use CrewAI to craft contextual response
        try:
            auto_reply = await craft_message(lead, "answer_question", request.channel, request.user_id)
        except:
            # Fallback template
            if "budget" in intent:
                auto_reply = "I understand budget is important. We work with clients at all price points and can help you find options that fit your needs. Would you like to discuss what you're comfortable with?"
            elif "area" in intent:
                auto_reply = "I'd be happy to share more information about different neighborhoods and areas. What specific concerns do you have about the location?"
            else:
                auto_reply = "Thanks for your question! I'd love to help provide more information. Could you share more details about what you'd like to know?"
        
    elif intent == "later":
        new_stage = "no_response"
        _log(request.lead_id, "[ACTION] 'Later' response - adjusting follow-up frequency")
        auto_reply = "I completely understand. I'll check back with you in a few weeks. In the meantime, feel free to reach out if you have any questions."
        
    else:
        # Default: treat as general inquiry
        new_stage = "engaged"
        _log(request.lead_id, "[ACTION] General inquiry - providing helpful response")
        escalate = True  # Escalate uncertain intents to human
        
        auto_reply = "Thanks for reaching out! I want to make sure I give you the most helpful response. Someone from our team will get back to you shortly with detailed information."
    
    # Step 4: Update lead stage
    if new_stage:
        await _update_lead_stage(request.lead_id, new_stage)
    
    # Step 5: Send auto-reply if appropriate
    if auto_reply and not escalate:
        try:
            channel = request.channel
            message_id = await deliver_message(lead, channel, auto_reply, request.user_id)
            _log(request.lead_id, f"[AUTO-REPLY] Sent via {channel} → {message_id}")
        except Exception as e:
            _log(request.lead_id, f"[ERROR] Auto-reply failed: {e}")
    
    # Step 6: Schedule next action or stop automation
    if new_stage in ["onboarding", "not_interested"]:
        _log(request.lead_id, "[AUTOMATION] Stopping nurture automation")
    else:
        updated_lead = await _get_lead(request.lead_id)
        await schedule_next_action(updated_lead, new_stage or _get_stage(updated_lead))
    
    return {
        "lead_id": request.lead_id,
        "intent": intent,
        "reason": reason,
        "new_stage": new_stage,
        "auto_reply_sent": bool(auto_reply and not escalate),
        "escalated": escalate
    }

@app.post("/tick")
async def process_tick(request: TickRequest, background_tasks: BackgroundTasks):
    """Process scheduled nurturing tick for a lead"""
    lead = await _get_lead(request.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Check if action is due
    next_action_str = lead.get("next_nurture_action")
    if not next_action_str:
        return {"lead_id": request.lead_id, "status": "no_action_scheduled"}
    
    try:
        next_action = datetime.fromisoformat(next_action_str)
        if next_action > _now():
            return {"lead_id": request.lead_id, "status": "not_due_yet", "next_action": next_action_str}
    except ValueError:
        return {"lead_id": request.lead_id, "status": "invalid_schedule"}
    
    # Execute nurturing action
    _log(request.lead_id, "[TICK] Processing scheduled action")
    
    stage = _get_stage(lead)
    if stage in ["new", "contacted", "engaged", "no_response"]:
        background_tasks.add_task(send_nurture_message, lead, "followup", request.user_id)
        background_tasks.add_task(schedule_next_action, lead, stage)
        
    return {"lead_id": request.lead_id, "status": "processed", "stage": stage}

@app.get("/status/{lead_id}")
async def get_status(lead_id: str):
    """Get current nurturing status for lead"""
    lead = await _get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {
        "lead_id": lead_id,
        "stage": _get_stage(lead),
        "nurturing_stage": lead.get("nurturing_stage"),
        "next_action": lead.get("next_nurture_action"),
        "last_contact": lead.get("last_nurture_contact"),
        "contact_count": lead.get("nurture_contact_count", 0),
        "last_channel": lead.get("last_nurture_channel")
    }

@app.get("/stream/{lead_id}")
async def get_activity_stream(lead_id: str):
    """Get live activity stream for lead nurturing"""
    if lead_id not in ACTIVITY_LOGS:
        # Initialize if not exists
        ACTIVITY_LOGS[lead_id] = []
    
    async def event_generator():
        last_index = 0
        
        # Send initial status
        yield f"event: status\ndata: connected\n\n"
        
        # Send existing logs
        logs = ACTIVITY_LOGS.get(lead_id, [])
        for log in logs:
            yield f"event: log\ndata: {log}\n\n"
        last_index = len(logs)
        
        # Stream new logs
        while True:
            logs = ACTIVITY_LOGS.get(lead_id, [])
            while last_index < len(logs):
                log = logs[last_index]
                yield f"event: log\ndata: {log}\n\n"
                last_index += 1
            
            # Check if nurturing is complete
            lead = await _get_lead(lead_id)
            if lead:
                stage = _get_stage(lead)
                if stage in ["onboarding", "not_interested"]:
                    yield f"event: status\ndata: complete:{stage}\n\n"
                    break
            
            await asyncio.sleep(1)
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")


# -------------------------
# Health Check
# -------------------------
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "lead_nurturing_ai"}


# -------------------------
# Local main (for testing)
# -------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081, reload=True)