#!/bin/bash
# Quick troubleshooting script for RealtorsPal AI Backend

echo "========================================================================"
echo "🔧 REALTORSPAL AI BACKEND - QUICK TROUBLESHOOT"
echo "========================================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check service status
echo ""
echo "📊 Service Status:"
echo "----------------------------------------"
sudo supervisorctl status | grep -E "backend|mongodb|frontend|marketing"

# 2. Check backend health
echo ""
echo "🏥 Backend Health Check:"
echo "----------------------------------------"
HEALTH_RESPONSE=$(curl -s http://localhost:8001/api/health 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend is responding${NC}"
    echo "$HEALTH_RESPONSE" | python -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    echo "Error: $HEALTH_RESPONSE"
fi

# 3. Check recent logs
echo ""
echo "📋 Recent Backend Logs (last 20 lines):"
echo "----------------------------------------"
tail -20 /var/log/supervisor/backend.out.log

# 4. Check for errors
echo ""
echo "⚠️  Recent Errors (if any):"
echo "----------------------------------------"
ERROR_COUNT=$(tail -50 /var/log/supervisor/backend.err.log 2>/dev/null | grep -c "Error\|ERROR\|FATAL\|Exception")
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo -e "${RED}Found $ERROR_COUNT error(s) in logs:${NC}"
    tail -50 /var/log/supervisor/backend.err.log | grep -i "Error\|ERROR\|FATAL\|Exception" | tail -10
else
    echo -e "${GREEN}No recent errors found${NC}"
fi

# 5. Check environment
echo ""
echo "🔐 Environment Variables:"
echo "----------------------------------------"
if [ -f "/app/backend/.env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    grep -v "^#" /app/backend/.env | grep "=" | head -5 | sed 's/=.*/=***/'
else
    echo -e "${RED}✗ .env file not found${NC}"
fi

# 6. Check MongoDB
echo ""
echo "💾 MongoDB Status:"
echo "----------------------------------------"
MONGO_STATUS=$(sudo supervisorctl status mongodb | awk '{print $2}')
if [ "$MONGO_STATUS" = "RUNNING" ]; then
    echo -e "${GREEN}✓ MongoDB is running${NC}"
else
    echo -e "${RED}✗ MongoDB is not running: $MONGO_STATUS${NC}"
fi

# 7. Check ports
echo ""
echo "🔌 Port Status:"
echo "----------------------------------------"
for PORT in 8001 3000 3001 27017; do
    if lsof -i :$PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Port $PORT is in use${NC}"
    else
        echo -e "${YELLOW}⚠ Port $PORT is not in use${NC}"
    fi
done

# 8. Quick fixes
echo ""
echo "========================================================================"
echo "🔧 QUICK FIXES"
echo "========================================================================"
echo ""
echo "If backend is not working, try these commands:"
echo ""
echo "1. Restart backend:"
echo "   sudo supervisorctl restart backend"
echo ""
echo "2. Restart all services:"
echo "   sudo supervisorctl restart all"
echo ""
echo "3. Check detailed logs:"
echo "   tail -100 /var/log/supervisor/backend.err.log"
echo ""
echo "4. Run verification script:"
echo "   cd /app/backend && python verify_startup.py"
echo ""
echo "5. Reinstall dependencies:"
echo "   cd /app/backend && pip install -r requirements.txt"
echo ""
echo "========================================================================"
