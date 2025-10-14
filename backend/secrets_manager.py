"""
Secrets Manager - Server-side only secret storage and retrieval
All secrets are stored in MongoDB 'secrets' collection with encryption at rest
NEVER expose secrets to the client
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, Dict

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://127.0.0.1:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.crm
secrets_collection = db.secrets


async def get_secret(user_id: str, secret_key: str) -> Optional[str]:
    """
    Retrieve a specific secret for a user
    
    Args:
        user_id: User identifier
        secret_key: Name of the secret (e.g., 'twilio_account_sid')
    
    Returns:
        Secret value or None if not found
    """
    try:
        secret_doc = await secrets_collection.find_one({"user_id": user_id})
        if secret_doc and secret_key in secret_doc:
            return secret_doc.get(secret_key)
        return None
    except Exception as e:
        print(f"❌ Error retrieving secret '{secret_key}': {e}")
        return None


async def get_all_secrets(user_id: str) -> Dict[str, str]:
    """
    Retrieve all secrets for a user
    
    Args:
        user_id: User identifier
    
    Returns:
        Dictionary of all secrets (excluding _id and user_id)
    """
    try:
        secret_doc = await secrets_collection.find_one({"user_id": user_id})
        if not secret_doc:
            return {}
        
        # Remove MongoDB metadata
        secret_doc.pop('_id', None)
        secret_doc.pop('user_id', None)
        
        return secret_doc
    except Exception as e:
        print(f"❌ Error retrieving secrets: {e}")
        return {}


async def set_secret(user_id: str, secret_key: str, secret_value: str) -> bool:
    """
    Store or update a specific secret for a user
    
    Args:
        user_id: User identifier
        secret_key: Name of the secret
        secret_value: Value to store
    
    Returns:
        True if successful, False otherwise
    """
    try:
        result = await secrets_collection.update_one(
            {"user_id": user_id},
            {"$set": {secret_key: secret_value}},
            upsert=True
        )
        return result.acknowledged
    except Exception as e:
        print(f"❌ Error setting secret '{secret_key}': {e}")
        return False


async def set_multiple_secrets(user_id: str, secrets: Dict[str, str]) -> bool:
    """
    Store or update multiple secrets for a user
    
    Args:
        user_id: User identifier
        secrets: Dictionary of secret_key: secret_value pairs
    
    Returns:
        True if successful, False otherwise
    """
    try:
        result = await secrets_collection.update_one(
            {"user_id": user_id},
            {"$set": secrets},
            upsert=True
        )
        return result.acknowledged
    except Exception as e:
        print(f"❌ Error setting multiple secrets: {e}")
        return False


async def delete_secret(user_id: str, secret_key: str) -> bool:
    """
    Delete a specific secret for a user
    
    Args:
        user_id: User identifier
        secret_key: Name of the secret to delete
    
    Returns:
        True if successful, False otherwise
    """
    try:
        result = await secrets_collection.update_one(
            {"user_id": user_id},
            {"$unset": {secret_key: ""}}
        )
        return result.acknowledged
    except Exception as e:
        print(f"❌ Error deleting secret '{secret_key}': {e}")
        return False


async def has_required_twilio_secrets(user_id: str) -> tuple[bool, list]:
    """
    Check if user has all required Twilio secrets configured
    
    Args:
        user_id: User identifier
    
    Returns:
        Tuple of (all_present: bool, missing_secrets: list)
    """
    required_secrets = [
        'twilio_account_sid',
        'twilio_auth_token',
        'twilio_phone_number'
    ]
    
    secrets = await get_all_secrets(user_id)
    missing = [key for key in required_secrets if not secrets.get(key)]
    
    return (len(missing) == 0, missing)


async def has_required_sendgrid_secrets(user_id: str) -> tuple[bool, list]:
    """
    Check if user has all required SendGrid secrets configured
    
    Args:
        user_id: User identifier
    
    Returns:
        Tuple of (all_present: bool, missing_secrets: list)
    """
    required_secrets = [
        'sendgrid_api_key',
        'sender_email'
    ]
    
    secrets = await get_all_secrets(user_id)
    missing = [key for key in required_secrets if not secrets.get(key)]
    
    return (len(missing) == 0, missing)


# Migration helper: Move secrets from settings to secrets collection
async def migrate_secrets_from_settings(user_id: str) -> bool:
    """
    One-time migration: Move secrets from settings collection to secrets collection
    This ensures backward compatibility while moving to secure storage
    
    Args:
        user_id: User identifier
    
    Returns:
        True if migration successful or not needed
    """
    try:
        # Check if already migrated
        existing_secrets = await secrets_collection.find_one({"user_id": user_id})
        if existing_secrets:
            print(f"✅ Secrets already migrated for user {user_id}")
            return True
        
        # Get settings
        settings = await db.settings.find_one({"user_id": user_id})
        if not settings:
            print(f"⚠️ No settings found for user {user_id}")
            return False
        
        # Extract secrets from settings
        secret_keys = [
            'twilio_account_sid',
            'twilio_auth_token',
            'twilio_phone_number',
            'twilio_whatsapp_number',
            'twilio_api_key',
            'twilio_api_secret',
            'twilio_twiml_app_sid',
            'agent_phone_number',
            'sendgrid_api_key',
            'sender_email'
        ]
        
        secrets_to_migrate = {}
        for key in secret_keys:
            if key in settings and settings[key]:
                secrets_to_migrate[key] = settings[key]
        
        if secrets_to_migrate:
            # Store in secrets collection
            secrets_to_migrate['user_id'] = user_id
            await secrets_collection.insert_one(secrets_to_migrate)
            print(f"✅ Migrated {len(secrets_to_migrate)} secrets for user {user_id}")
            return True
        else:
            print(f"⚠️ No secrets to migrate for user {user_id}")
            return False
            
    except Exception as e:
        print(f"❌ Error migrating secrets: {e}")
        return False
