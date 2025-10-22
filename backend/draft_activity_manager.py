"""
Draft Activity Manager
Handles creation and synchronization of draft activities for email/SMS drafts
"""

import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Database connection
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get('DB_NAME')
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


async def get_highest_urgency(drafts: List[dict]) -> Tuple[str, str]:
    """
    Determine the highest urgency from a list of drafts.
    Returns tuple of (urgency_level, urgency_badge_text)
    Priority: urgent > first_time_email > follow_up > normal
    """
    urgency_priority = {
        'urgent': (1, 'Urgent Email'),
        'high': (1, 'Urgent Email'),
        'first_time_email': (2, 'First Nurture Email'),
        'follow_up': (3, 'Follow-up Email'),
        'normal': (4, 'Email')
    }
    
    highest_urgency = 'normal'
    highest_badge = 'Email'
    highest_priority = 999
    
    for draft in drafts:
        # Check urgency field
        draft_urgency = draft.get('urgency', 'normal').lower()
        # Check email_type field for first_time_email
        email_type = draft.get('email_type', '').lower()
        
        # Determine which to check
        check_value = draft_urgency
        if email_type == 'first_time_email' and draft_urgency == 'normal':
            check_value = 'first_time_email'
        
        priority, badge = urgency_priority.get(check_value, (4, 'Email'))
        
        if priority < highest_priority:
            highest_priority = priority
            highest_urgency = check_value
            highest_badge = badge
    
    return (highest_urgency, highest_badge)


async def get_or_create_draft_activity(lead_id: str, user_id: str, channel: str) -> Optional[dict]:
    """
    Get existing draft activity or create new one for a lead and channel (email/sms).
    Returns the activity document.
    """
    try:
        # Try to find existing pending draft activity for this lead and channel
        activity = await db.nurturing_activities.find_one({
            "lead_id": lead_id,
            "user_id": user_id,
            "activity_type": f"pending_{channel}_drafts",
            "status": "pending"
        })
        
        if activity:
            return activity
        
        # Create new activity
        activity_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        
        new_activity = {
            "id": activity_id,
            "lead_id": lead_id,
            "user_id": user_id,
            "activity_type": f"pending_{channel}_drafts",
            "title": f"Pending {'Email' if channel == 'email' else 'SMS'} Drafts",
            "description": f"AI-generated {'email' if channel == 'email' else 'SMS'} drafts ready to send",
            "action": channel,
            "status": "pending",
            "draft_count": 0,
            "urgency_level": "normal",
            "urgency_badge": "Email" if channel == "email" else "SMS",
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "created_at": now_iso,
            "updated_at": now_iso
        }
        
        await db.nurturing_activities.insert_one(new_activity)
        return new_activity
    except Exception as e:
        print(f"Error in get_or_create_draft_activity: {e}")
        return None


async def update_draft_activity(lead_id: str, user_id: str, channel: str) -> bool:
    """
    Update draft activity count and urgency badge for a lead and channel.
    This should be called whenever drafts are created, sent, or deleted.
    """
    try:
        # Get all pending drafts for this lead and channel
        query = {
            "lead_id": lead_id,
            "user_id": user_id,
            "channel": channel,
            "status": "draft"
        }
        
        drafts = await db.email_drafts.find(query).to_list(length=None)
        draft_count = len(drafts)
        
        # Get or create activity
        activity = await get_or_create_draft_activity(lead_id, user_id, channel)
        
        if not activity:
            print(f"Failed to get or create activity for lead {lead_id}, channel {channel}")
            return False
        
        if draft_count == 0:
            # No pending drafts - mark activity as completed
            await db.nurturing_activities.update_one(
                {"id": activity["id"]},
                {
                    "$set": {
                        "status": "completed",
                        "draft_count": 0,
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        else:
            # Update draft count and urgency
            urgency_level, urgency_badge = await get_highest_urgency(drafts)
            
            await db.nurturing_activities.update_one(
                {"id": activity["id"]},
                {
                    "$set": {
                        "draft_count": draft_count,
                        "urgency_level": urgency_level,
                        "urgency_badge": urgency_badge,
                        "status": "pending",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        
        print(f"✅ Draft activity updated: lead={lead_id}, channel={channel}, count={draft_count}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating draft activity: {e}")
        import traceback
        traceback.print_exc()
        return False
