#!/usr/bin/env python3
"""
Script to sync draft activities for all leads with existing email/SMS drafts
"""
import os
import sys
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# Import from draft_activity_manager
from draft_activity_manager import update_draft_activity

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "realtorspal"

async def sync_all_draft_activities():
    """Sync draft activities for all leads with drafts"""
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Get all unique lead_id + user_id combinations from email_drafts
    print("\nFinding all leads with drafts...")
    pipeline = [
        {"$match": {"status": "draft"}},
        {"$group": {
            "_id": {
                "lead_id": "$lead_id",
                "user_id": "$user_id",
                "channel": "$channel"
            }
        }}
    ]
    
    groups = await db.email_drafts.aggregate(pipeline).to_list(length=None)
    
    print(f"Found {len(groups)} lead+channel combinations with drafts\n")
    
    synced_count = 0
    for group in groups:
        lead_id = group["_id"]["lead_id"]
        user_id = group["_id"]["user_id"]
        channel = group["_id"]["channel"]
        
        print(f"Syncing: Lead {lead_id[:8]}..., Channel: {channel}")
        
        try:
            success = await update_draft_activity(lead_id, user_id, channel)
            if success:
                synced_count += 1
                print(f"  ✅ Success")
            else:
                print(f"  ❌ Failed")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    print(f"\n✅ Synced {synced_count}/{len(groups)} draft activities")
    
    # Show some stats
    activity_count = await db.nurturing_activities.count_documents({"activity_type": {"$regex": "draft"}})
    print(f"Total draft activities in DB: {activity_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(sync_all_draft_activities())
