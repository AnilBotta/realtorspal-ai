# RealtorsPal AI - Deployment Guide

## Pre-Deployment Checklist

### 1. Verify Backend Startup

Before deploying, always verify the backend configuration:

```bash
cd /app/backend
python verify_startup.py
```

This script checks:
- ✓ Python version (3.8+)
- ✓ All critical dependencies
- ✓ Optional dependencies
- ✓ Environment variables
- ✓ Required files
- ✓ MongoDB connection

### 2. Check Environment Variables

Ensure these are set in `/app/backend/.env`:

**Required:**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=realtorspal
```

**Optional but Recommended:**
```env
EMERGENT_LLM_KEY=sk-emergent-xxxx
CORS_ORIGINS=*
REACT_APP_BACKEND_URL=https://your-domain.com
JWT_SECRET_KEY=your-secret-key
```

### 3. Test Backend Health

After starting, test the health endpoint:

```bash
curl http://localhost:8001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "RealtorsPal AI Backend",
  "timestamp": "2025-11-11T...",
  "database": "connected",
  "environment": {
    "mongo_url_set": true,
    "db_name": "realtorspal",
    "emergent_llm_key_set": true
  }
}
```

## Startup Sequence

The backend now logs detailed startup information. Check logs with:
```bash
tail -f /var/log/supervisor/backend.out.log
```

You should see:
```
🚀 REALTORSPAL AI BACKEND - STARTUP SEQUENCE
📋 Step 1/5: Loading Environment Variables...
📋 Step 2/5: Initializing Security Components...
📋 Step 3/5: Setting up JWT Authentication...
📋 Step 4/5: Initializing FastAPI Application...
📋 Step 5/5: Connecting to MongoDB...
✅ BACKEND STARTUP COMPLETE - Server is ready!
```

## Common Deployment Issues & Solutions

### Issue 1: Backend Not Starting

**Check logs:**
```bash
tail -100 /var/log/supervisor/backend.err.log
sudo supervisorctl status backend
```

**Solution:**
```bash
cd /app/backend
python verify_startup.py
pip install -r requirements.txt
sudo supervisorctl restart backend
```

### Issue 2: MongoDB Connection Failed

**Solution:**
```bash
sudo supervisorctl restart mongodb
grep MONGO_URL /app/backend/.env
```

### Issue 3: Missing Dependencies

**Solution:**
```bash
cd /app/backend
pip install -r requirements.txt
sudo supervisorctl restart backend
```

## Deployment Steps

### Quick Deploy
```bash
# 1. Verify configuration
cd /app/backend && python verify_startup.py

# 2. Restart all services
sudo supervisorctl restart all

# 3. Verify health
sleep 5
curl http://localhost:8001/api/health
```

### Full Deploy
```bash
# 1. Stop services
sudo supervisorctl stop all

# 2. Update dependencies
cd /app/backend && pip install -r requirements.txt
cd /app/frontend && yarn install
cd /app/marketing && yarn install && yarn build

# 3. Verify backend
cd /app/backend && python verify_startup.py

# 4. Start services
sudo supervisorctl start all

# 5. Check status
sudo supervisorctl status
curl http://localhost:8001/api/health
```

## Monitoring

```bash
# Real-time logs
tail -f /var/log/supervisor/backend.out.log

# Service status
sudo supervisorctl status

# Health check
curl http://localhost:8001/api/health | python -m json.tool
```

## Emergency Rollback

```bash
sudo supervisorctl stop all
git reset --hard HEAD~1
cd /app/backend && pip install -r requirements.txt
sudo supervisorctl start all
```
