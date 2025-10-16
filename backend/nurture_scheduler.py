"""
Lead Nurturing Background Task Scheduler
Handles server-side sequence execution independent of UI
"""

import os
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

# Load environment
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")

if not MONGO_URL or not DB_NAME:
    raise RuntimeError("MONGO_URL and DB_NAME must be set in environment")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Global scheduler instance
scheduler: Optional[AsyncIOScheduler] = None


async def log_activity(lead_id: str, user_id: str, message: str, action_type: str = "info"):
    """Log nurturing activity to database"""
    try:
        activity_log = {
            "lead_id": lead_id,
            "user_id": user_id,
            "message": message,
            "action_type": action_type,  # info, success, error, warning
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "background_scheduler"
        }
        
        await db.nurture_activity_logs.insert_one(activity_log)
        logger.info(f"[{lead_id}] {message}")
        
    except Exception as e:
        logger.error(f"Failed to log activity for lead {lead_id}: {e}")


async def execute_nurturing_step(lead_id: str, user_id: str):
    """
    Execute a single nurturing step for a lead
    This is called by the scheduler when a nurturing action is due
    """
    try:
        # Get lead from database
        lead = await db.leads.find_one({"id": lead_id, "user_id": user_id})
        if not lead:
            logger.warning(f"Lead {lead_id} not found")
            return
        
        # Check if nurturing is active
        if lead.get("nurturing_status") not in ["active", "running"]:
            await log_activity(lead_id, user_id, f"Nurturing not active (status: {lead.get('nurturing_status')})", "warning")
            return
        
        # Check if action is due
        next_action_str = lead.get("nurturing_next_action_at")
        if not next_action_str:
            await log_activity(lead_id, user_id, "No next action scheduled", "info")
            return
        
        try:
            next_action_time = datetime.fromisoformat(next_action_str.replace('Z', '+00:00'))
            if next_action_time.tzinfo is None:
                next_action_time = next_action_time.replace(tzinfo=timezone.utc)
            
            now = datetime.now(timezone.utc)
            if next_action_time > now:
                # Not due yet
                return
        except (ValueError, AttributeError) as e:
            await log_activity(lead_id, user_id, f"Invalid next action time: {e}", "error")
            return
        
        # Execute the nurturing step
        current_step = lead.get("nurturing_current_step", 0)
        total_steps = lead.get("nurturing_total_steps", 0)
        
        await log_activity(lead_id, user_id, f"Executing step {current_step + 1}/{total_steps}", "info")
        
        # Import nurturing logic from lead_nurture_service
        from lead_nurture_service import send_nurture_message, schedule_next_action, _get_stage
        
        # Determine purpose based on stage
        stage = _get_stage(lead)
        if stage == "new":
            purpose = "welcome"
        elif stage in ["contacted", "engaged"]:
            purpose = "followup"
        elif stage == "no_response":
            purpose = "reengage"
        else:
            await log_activity(lead_id, user_id, f"Stage {stage} doesn't need nurturing", "info")
            return
        
        # Send nurturing message
        message_id = await send_nurture_message(lead, purpose, user_id)
        
        if message_id:
            # Update step counter
            new_step = current_step + 1
            
            # Check if sequence is complete
            if new_step >= total_steps:
                await db.leads.update_one(
                    {"id": lead_id},
                    {"$set": {
                        "nurturing_status": "completed",
                        "nurturing_completed_at": datetime.now(timezone.utc).isoformat(),
                        "nurturing_current_step": new_step
                    }}
                )
                await log_activity(lead_id, user_id, f"Nurturing sequence completed", "success")
            else:
                # Update step and schedule next action
                await db.leads.update_one(
                    {"id": lead_id},
                    {"$set": {"nurturing_current_step": new_step}}
                )
                
                # Schedule next action
                await schedule_next_action(lead, stage)
                
                # Get updated next action time
                updated_lead = await db.leads.find_one({"id": lead_id})
                next_time = updated_lead.get("nurturing_next_action_at", "unknown")
                
                await log_activity(
                    lead_id, user_id,
                    f"Step {new_step}/{total_steps} completed. Next action at {next_time}",
                    "success"
                )
        else:
            await log_activity(lead_id, user_id, f"Failed to send nurturing message", "error")
    
    except Exception as e:
        logger.error(f"Error executing nurturing step for lead {lead_id}: {e}")
        await log_activity(lead_id, user_id, f"Error: {str(e)}", "error")


async def check_and_execute_due_nurturing():
    """
    Check all active nurturing sequences and execute due actions
    This runs every minute via the scheduler
    """
    try:
        logger.info("Checking for due nurturing actions...")
        
        # Find all leads with active nurturing
        now = datetime.now(timezone.utc)
        
        # Query leads with active nurturing status
        active_leads = await db.leads.find({
            "nurturing_status": {"$in": ["active", "running"]},
            "nurturing_next_action_at": {"$exists": True, "$ne": None}
        }).to_list(length=None)
        
        logger.info(f"Found {len(active_leads)} leads with active nurturing")
        
        for lead in active_leads:
            try:
                # Check if action is due
                next_action_str = lead.get("nurturing_next_action_at")
                if not next_action_str:
                    continue
                
                next_action_time = datetime.fromisoformat(next_action_str.replace('Z', '+00:00'))
                if next_action_time.tzinfo is None:
                    next_action_time = next_action_time.replace(tzinfo=timezone.utc)
                
                # If action is due (or overdue), execute it
                if next_action_time <= now:
                    lead_id = lead.get("id")
                    user_id = lead.get("user_id")
                    
                    logger.info(f"Executing due nurturing action for lead {lead_id}")
                    await execute_nurturing_step(lead_id, user_id)
                    
            except Exception as e:
                logger.error(f"Error processing lead {lead.get('id', 'unknown')}: {e}")
                continue
    
    except Exception as e:
        logger.error(f"Error in check_and_execute_due_nurturing: {e}")


def start_scheduler():
    """Start the background scheduler"""
    global scheduler
    
    if scheduler is not None:
        logger.warning("Scheduler already running")
        return scheduler
    
    logger.info("Starting nurturing background scheduler...")
    
    scheduler = AsyncIOScheduler()
    
    # Check for due nurturing actions every minute
    scheduler.add_job(
        check_and_execute_due_nurturing,
        trigger=IntervalTrigger(minutes=1),
        id="check_nurturing",
        replace_existing=True,
        max_instances=1
    )
    
    scheduler.start()
    logger.info("Nurturing scheduler started successfully")
    
    return scheduler


def stop_scheduler():
    """Stop the background scheduler"""
    global scheduler
    
    if scheduler is not None:
        logger.info("Stopping nurturing scheduler...")
        scheduler.shutdown()
        scheduler = None
        logger.info("Scheduler stopped")


async def get_active_nurturing_leads(user_id: str):
    """Get all leads with active nurturing for a user"""
    try:
        leads = await db.leads.find({
            "user_id": user_id,
            "nurturing_status": {"$in": ["active", "running", "paused", "snoozed"]}
        }).to_list(length=None)
        
        return leads
    
    except Exception as e:
        logger.error(f"Error getting active nurturing leads: {e}")
        return []


async def get_nurturing_activity_logs(lead_id: str, limit: int = 50):
    """Get activity logs for a specific lead"""
    try:
        logs = await db.nurture_activity_logs.find(
            {"lead_id": lead_id}
        ).sort("timestamp", -1).limit(limit).to_list(length=None)
        
        return logs
    
    except Exception as e:
        logger.error(f"Error getting activity logs: {e}")
        return []
