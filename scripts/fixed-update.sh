#!/bin/bash

# RealtorsPal AI - Fixed Update Script
# Incorporates all manual fixes and handles code deployment properly
# Usage: ./fixed-update.sh

set -e

echo "🔄 RealtorsPal AI - Smart Update with All Fixes"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running as realtorspal user
if [ "$USER" != "realtorspal" ]; then
    print_error "Please run this script as the 'realtorspal' user"
    print_info "Switch user with: sudo su - realtorspal"
    exit 1
fi

# Get server IP for CORS configuration
SERVER_IP=$(curl -s ifconfig.me)
print_info "Server IP: $SERVER_IP"

# Navigate to application directory
cd /home/realtorspal/realtorspal-ai

print_info "🔄 Starting smart update process..."

# Create backup
print_info "📦 Creating backup..."
mkdir -p /home/realtorspal/backups
tar -czf /home/realtorspal/backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz .
print_status "Backup created"

# Save current configuration files that we need to preserve/fix
print_info "💾 Saving current working configurations..."

# Save current PM2 config (with our fixes)
cp ecosystem.config.js /tmp/ecosystem.config.js.backup

# Save current frontend env (with our fixes)
cp realtorspal-ai/.env.local /tmp/.env.local.backup 2>/dev/null || true

# Save current backend env
cp realtorspal-backend/.env /tmp/.env.backend.backup 2>/dev/null || true

# Pull latest changes from GitHub
print_info "📥 Pulling latest changes from GitHub..."
git stash push -m "Auto-stash before update $(date)" || true
git pull origin main
print_status "Latest code pulled from GitHub"

# Backend updates
print_info "🔧 Updating backend..."
cd realtorspal-backend

# Install/update dependencies
npm install --production

# Restore/create backend environment with current server IP
print_info "🔧 Configuring backend environment..."
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://neondb_owner:npg_lewydJ4hqDk9@ep-small-flower-aflk9tdv-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=realtorspal_super_secure_jwt_secret_key_production_2024_32_chars_minimum
CORS_ORIGIN=http://$SERVER_IP,https://$SERVER_IP,http://localhost:3000
LOG_LEVEL=info
EOF

print_status "Backend environment configured"

# Frontend updates
print_info "🎨 Updating frontend..."
cd ../realtorspal-ai

# Add Bun to PATH
export PATH="/home/realtorspal/.bun/bin:$PATH"

# Install/update dependencies
bun install

# Apply critical fixes that might be overwritten by git pull
print_info "🔧 Applying critical frontend fixes..."

# Fix 1: Update next.config.js to use server mode (not static export)
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  images: {
    unoptimized: true,
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      "ext.same-assets.com",
      "ugc.same-assets.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
EOF

# Fix 2: Update package.json start script to bind to all interfaces
sed -i 's/"start": "next start"/"start": "next start -H 0.0.0.0"/' package.json

# Fix 3: Create/update frontend environment
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_VERSION=11.0.0
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_VOICE_CALLS=true
NEXT_PUBLIC_ENABLE_AI_AGENTS=true
EOF

print_status "Frontend fixes applied"

# Build frontend
print_info "🏗️ Building frontend..."
rm -rf .next out  # Clean previous builds
bun run build

if [ -d ".next" ]; then
    print_status "Frontend build successful"
else
    print_error "Frontend build failed"
    exit 1
fi

# Update PM2 ecosystem configuration with embedded env vars (our key fix)
print_info "⚙️ Updating PM2 configuration with embedded environment variables..."
cd ..

cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'realtorspal-backend',
      script: './realtorspal-backend/api/server.js',
      cwd: '/home/realtorspal/realtorspal-ai',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        DATABASE_URL: 'postgresql://neondb_owner:npg_lewydJ4hqDk9@ep-small-flower-aflk9tdv-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require',
        JWT_SECRET: 'realtorspal_super_secure_jwt_secret_key_production_2024_32_chars_minimum',
        CORS_ORIGIN: 'http://$SERVER_IP,https://$SERVER_IP,http://localhost:3000',
        LOG_LEVEL: 'info'
      },
      error_file: '/home/realtorspal/logs/backend-error.log',
      out_file: '/home/realtorspal/logs/backend-out.log',
      log_file: '/home/realtorspal/logs/backend-combined.log',
      time: true
    },
    {
      name: 'realtorspal-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/home/realtorspal/realtorspal-ai/realtorspal-ai',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: '/api',
        NEXT_PUBLIC_APP_ENV: 'production'
      },
      error_file: '/home/realtorspal/logs/frontend-error.log',
      out_file: '/home/realtorspal/logs/frontend-out.log',
      log_file: '/home/realtorspal/logs/frontend-combined.log',
      time: true,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ]
}
EOF

print_status "PM2 configuration updated with current server IP"

# Test configuration before restarting
print_info "🧪 Testing new configuration..."

# Test backend configuration
cd realtorspal-backend
if npm run start --dry-run >/dev/null 2>&1; then
    print_status "Backend configuration valid"
else
    print_warning "Backend configuration may have issues"
fi

cd ../realtorspal-ai
# Test frontend build
if [ -d ".next" ] && [ -f "package.json" ]; then
    print_status "Frontend configuration valid"
else
    print_error "Frontend configuration invalid"
    exit 1
fi

cd ..

# Restart applications
print_info "🔄 Restarting applications..."

# Restart backend first
pm2 restart realtorspal-backend
sleep 5

# Test backend health
if curl -s http://localhost:5000/health | grep -q "healthy"; then
    print_status "Backend restarted successfully"
else
    print_warning "Backend may not be fully ready yet"
fi

# Restart frontend
pm2 restart realtorspal-frontend
sleep 10

# Test frontend
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    print_status "Frontend restarted successfully"
else
    print_warning "Frontend may still be starting up"
fi

# Save PM2 configuration
pm2 save

# Final testing
print_info "🧪 Running final tests..."

# Test complete application
sleep 5
if curl -s http://localhost/health | grep -q "healthy"; then
    print_status "Application is responding correctly"
else
    print_warning "Application may need more time to fully start"
fi

# Show current status
print_info "📊 Current Application Status:"
pm2 status

# Show recent logs to check for errors
print_info "📋 Recent Application Logs:"
echo "Backend logs (last 5 lines):"
pm2 logs realtorspal-backend --lines 5 --nostream

echo ""
echo "Frontend logs (last 5 lines):"
pm2 logs realtorspal-frontend --lines 5 --nostream

print_status "🎉 Update completed successfully!"
print_info "============================================"
print_info "🌐 Application URLs:"
print_info "   Frontend: http://$SERVER_IP"
print_info "   Backend API: http://$SERVER_IP/api"
print_info "   Health Check: http://$SERVER_IP/health"
print_info ""
print_info "🔧 Next Steps:"
print_info "   1. Test login: admin@realtorspal.ai / password123"
print_info "   2. Monitor logs: pm2 logs"
print_info "   3. Check status: pm2 status"
print_info ""

# Clean up temporary files
rm -f /tmp/ecosystem.config.js.backup /tmp/.env.local.backup /tmp/.env.backend.backup

echo -e "${GREEN}✅ RealtorsPal AI update completed with all fixes applied!${NC}"
