#!/bin/bash

# RealtorsPal AI Backend Deployment Test Script
# Usage: ./test-deployment.sh <your-backend-url>

if [ -z "$1" ]; then
    echo "❌ Please provide your backend URL"
    echo "Usage: ./test-deployment.sh https://your-app.up.railway.app"
    exit 1
fi

BACKEND_URL="$1"

echo "🚀 Testing RealtorsPal AI Backend Deployment"
echo "📡 Backend URL: $BACKEND_URL"
echo "----------------------------------------"

# Test 1: Health Check
echo "🏥 Testing Health Check..."
curl -s "$BACKEND_URL/health" | grep -q "healthy" && echo "✅ Health check passed" || echo "❌ Health check failed"

# Test 2: API Documentation
echo "📖 Testing API Documentation..."
curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api-docs" | grep -q "200" && echo "✅ API docs accessible" || echo "❌ API docs failed"

# Test 3: Authentication endpoint
echo "🔐 Testing Authentication Endpoint..."
response=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@realtorspal.ai","password":"password123"}' \
  -w "%{http_code}")

if echo "$response" | grep -q "200"; then
    echo "✅ Authentication endpoint working"
else
    echo "❌ Authentication endpoint failed"
fi

# Test 4: CORS headers
echo "🌐 Testing CORS Configuration..."
curl -s -I "$BACKEND_URL/health" | grep -q "access-control-allow-origin" && echo "✅ CORS configured" || echo "❌ CORS not configured"

echo "----------------------------------------"
echo "🎉 Deployment test complete!"
echo "📱 Frontend Integration: Update NEXT_PUBLIC_API_URL to $BACKEND_URL"
