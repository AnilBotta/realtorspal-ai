#!/usr/bin/env python3
"""
Backend Startup Verification Script
Run this before starting the server to verify all dependencies and configuration
"""

import sys
import os
from pathlib import Path

print("=" * 80)
print("🔍 REALTORSPAL AI BACKEND - PRE-STARTUP VERIFICATION")
print("=" * 80)

errors = []
warnings = []

# 1. Check Python version
print("\n📋 Checking Python version...")
python_version = sys.version_info
if python_version.major == 3 and python_version.minor >= 8:
    print(f"   ✓ Python {python_version.major}.{python_version.minor}.{python_version.micro}")
else:
    errors.append(f"Python 3.8+ required, found {python_version.major}.{python_version.minor}")
    print(f"   ✗ Python version too old: {python_version.major}.{python_version.minor}")

# 2. Check critical imports
print("\n📋 Checking critical dependencies...")
critical_modules = [
    ("fastapi", "FastAPI framework"),
    ("motor", "MongoDB async driver"),
    ("pydantic", "Data validation"),
    ("bcrypt", "Password hashing"),
    ("jwt", "JWT tokens"),
    ("dotenv", "Environment variables"),
    ("twilio", "Twilio integration"),
    ("sendgrid", "SendGrid email"),
]

for module_name, description in critical_modules:
    try:
        __import__(module_name)
        print(f"   ✓ {module_name:20} - {description}")
    except ImportError as e:
        errors.append(f"Missing module: {module_name}")
        print(f"   ✗ {module_name:20} - MISSING: {e}")

# 3. Check optional imports
print("\n📋 Checking optional dependencies...")
optional_modules = [
    ("crewai", "CrewAI for agents"),
    ("emergentintegrations", "Emergent LLM integration"),
]

for module_name, description in optional_modules:
    try:
        __import__(module_name)
        print(f"   ✓ {module_name:20} - {description}")
    except ImportError:
        warnings.append(f"Optional module missing: {module_name}")
        print(f"   ⚠ {module_name:20} - Optional (not installed)")

# 4. Check environment variables
print("\n📋 Checking environment variables...")

# Load .env file if exists
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    print(f"   → Loading .env from: {env_path}")
    from dotenv import load_dotenv
    load_dotenv(env_path)
else:
    warnings.append(".env file not found")
    print(f"   ⚠ No .env file found at: {env_path}")

# Check required env vars
required_env_vars = {
    "MONGO_URL": "MongoDB connection string",
    "DB_NAME": "Database name",
}

for var_name, description in required_env_vars.items():
    value = os.environ.get(var_name)
    if value:
        # Mask sensitive values
        if "password" in var_name.lower() or "key" in var_name.lower() or "token" in var_name.lower() or "MONGO" in var_name:
            display_value = "***" + value[-4:] if len(value) > 4 else "***"
        else:
            display_value = value[:50] + "..." if len(value) > 50 else value
        print(f"   ✓ {var_name:25} = {display_value}")
    else:
        errors.append(f"Missing environment variable: {var_name}")
        print(f"   ✗ {var_name:25} - REQUIRED: {description}")

# Check optional env vars
optional_env_vars = {
    "EMERGENT_LLM_KEY": "Emergent LLM API key",
    "CORS_ORIGINS": "CORS allowed origins",
    "REACT_APP_BACKEND_URL": "Frontend URL",
    "JWT_SECRET_KEY": "JWT secret key",
}

for var_name, description in optional_env_vars.items():
    value = os.environ.get(var_name)
    if value:
        if "password" in var_name.lower() or "key" in var_name.lower() or "token" in var_name.lower() or "secret" in var_name.lower():
            display_value = "***" + value[-4:] if len(value) > 4 else "***"
        else:
            display_value = value[:50] + "..." if len(value) > 50 else value
        print(f"   ✓ {var_name:25} = {display_value}")
    else:
        warnings.append(f"Optional env var not set: {var_name}")
        print(f"   ⚠ {var_name:25} - Optional: {description}")

# 5. Check file structure
print("\n📋 Checking file structure...")
required_files = [
    "server.py",
    "requirements.txt",
    "secrets_manager.py",
    "draft_activity_manager.py",
]

backend_dir = Path(__file__).parent
for filename in required_files:
    file_path = backend_dir / filename
    if file_path.exists():
        print(f"   ✓ {filename}")
    else:
        errors.append(f"Missing file: {filename}")
        print(f"   ✗ {filename} - MISSING")

# 6. Check MongoDB connection (if possible)
print("\n📋 Testing MongoDB connection...")
mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME")

if mongo_url and db_name:
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import asyncio
        
        async def test_connection():
            try:
                client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
                await client.admin.command('ping')
                print(f"   ✓ MongoDB connection successful")
                print(f"   ✓ Database: {db_name}")
                client.close()
                return True
            except Exception as e:
                print(f"   ✗ MongoDB connection failed: {e}")
                return False
        
        # Run async test
        success = asyncio.run(test_connection())
        if not success:
            errors.append("MongoDB connection failed")
    except Exception as e:
        errors.append(f"MongoDB test error: {e}")
        print(f"   ✗ Could not test MongoDB: {e}")
else:
    errors.append("Cannot test MongoDB - MONGO_URL or DB_NAME not set")
    print(f"   ✗ Cannot test MongoDB connection - missing credentials")

# Summary
print("\n" + "=" * 80)
print("📊 VERIFICATION SUMMARY")
print("=" * 80)

if errors:
    print(f"\n❌ ERRORS FOUND ({len(errors)}):")
    for i, error in enumerate(errors, 1):
        print(f"   {i}. {error}")

if warnings:
    print(f"\n⚠️  WARNINGS ({len(warnings)}):")
    for i, warning in enumerate(warnings, 1):
        print(f"   {i}. {warning}")

if not errors:
    print("\n✅ All critical checks passed!")
    print("   The backend should start successfully.")
    print("\nTo start the backend, run:")
    print("   uvicorn server:app --host 0.0.0.0 --port 8001 --reload")
else:
    print(f"\n❌ Found {len(errors)} critical error(s)")
    print("   Please fix the above issues before starting the backend.")
    sys.exit(1)

print("\n" + "=" * 80)
