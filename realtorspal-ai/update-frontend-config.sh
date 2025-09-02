#!/bin/bash

# RealtorsPal AI Frontend Configuration Update Script
# Usage: ./update-frontend-config.sh <your-backend-url>

if [ -z "$1" ]; then
    echo "❌ Please provide your backend URL"
    echo "Usage: ./update-frontend-config.sh https://your-app.up.railway.app"
    exit 1
fi

BACKEND_URL="$1"

echo "🔧 Updating RealtorsPal AI Frontend Configuration"
echo "🔗 Backend URL: $BACKEND_URL"
echo "----------------------------------------"

# Update .env.local file
echo "📝 Updating realtorspal-ai/.env.local..."
cat > realtorspal-ai/.env.local << EOF
# RealtorsPal AI Frontend Environment Configuration
# Updated: $(date)

# Backend API URL - Production
NEXT_PUBLIC_API_URL=$BACKEND_URL

# App Environment
NEXT_PUBLIC_APP_ENV=production

# Version
NEXT_PUBLIC_APP_VERSION=11.0.0

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_VOICE_CALLS=true
NEXT_PUBLIC_ENABLE_AI_AGENTS=true
EOF

echo "✅ Frontend configuration updated!"
echo "----------------------------------------"

# Test the API connection
echo "🧪 Testing API connection..."
if curl -s "$BACKEND_URL/health" | grep -q "healthy"; then
    echo "✅ Backend is responding correctly"
else
    echo "❌ Backend is not responding - check your URL"
fi

echo "----------------------------------------"
echo "🚀 Next Steps:"
echo "1. cd realtorspal-ai"
echo "2. bun run build"
echo "3. Deploy to Netlify/Vercel"
echo "4. Test the live application!"

echo ""
echo "📱 Current Frontend URL: https://same-dti5u6vmxdi-latest.netlify.app"
echo "🔗 Production Backend: $BACKEND_URL"
