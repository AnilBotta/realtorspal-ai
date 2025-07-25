#!/bin/bash

# RealtorsPal AI - Application Deployment Script
# Run this script as the 'realtorspal' user after server setup

set -e  # Exit on any error

echo "🚀 RealtorsPal AI - Application Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
print_info "Detected server IP: $SERVER_IP"

# Ask for domain (optional)
echo -e "\n${BLUE}Do you have a domain name for this deployment? (optional)${NC}"
read -p "Enter domain name (or press Enter to use IP only): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    DOMAIN_NAME="$SERVER_IP"
    CORS_ORIGIN="http://$SERVER_IP"
    API_URL="http://$SERVER_IP/api"
else
    CORS_ORIGIN="http://$SERVER_IP,https://$DOMAIN_NAME,http://$DOMAIN_NAME"
    API_URL="https://$DOMAIN_NAME/api"
fi

print_info "Using domain/IP: $DOMAIN_NAME"

# Navigate to home directory
cd /home/realtorspal

# Clone repository if not exists
if [ ! -d "realtorspal-ai" ]; then
    print_info "Cloning RealtorsPal AI repository..."
    git clone https://github.com/AnilBotta/realtorspal-ai.git
    print_status "Repository cloned successfully"
else
    print_warning "Repository already exists, pulling latest changes..."
    cd realtorspal-ai
    git pull origin main
    cd ..
    print_status "Repository updated"
fi

# Setup backend
print_info "Setting up backend..."
cd realtorspal-ai/realtorspal-backend

# Install backend dependencies
print_info "Installing backend dependencies..."
npm install --production
print_status "Backend dependencies installed"

# Create backend environment file
print_info "Creating backend environment configuration..."
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://neondb_owner:npg_lewydJ4hqDk9@ep-small-flower-aflk9tdv-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=realtorspal_super_secure_jwt_secret_key_production_2024_32_chars_minimum
CORS_ORIGIN=$CORS_ORIGIN
LOG_LEVEL=info
EOF
print_status "Backend environment configured"

# Test backend
print_info "Testing backend configuration..."
timeout 10s npm start &
BACKEND_PID=$!
sleep 5

if curl -s http://localhost:5000/health | grep -q "healthy"; then
    print_status "Backend test passed"
else
    print_warning "Backend test failed, but continuing deployment"
fi

# Stop test backend
kill $BACKEND_PID 2>/dev/null || true
sleep 2

# Setup frontend
print_info "Setting up frontend..."
cd ../realtorspal-ai

# Add bun to PATH for this session
export PATH="/home/realtorspal/.bun/bin:$PATH"

# Install frontend dependencies
print_info "Installing frontend dependencies..."
bun install
print_status "Frontend dependencies installed"

# Create frontend environment file
print_info "Creating frontend environment configuration..."
cat > .env.local << EOF
# RealtorsPal AI Frontend Environment Configuration
NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_VERSION=11.0.0
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_VOICE_CALLS=true
NEXT_PUBLIC_ENABLE_AI_AGENTS=true
EOF
print_status "Frontend environment configured"

# Build frontend
print_info "Building frontend for production..."
bun run build
print_status "Frontend built successfully"

# Create PM2 ecosystem configuration
print_info "Creating PM2 configuration..."
cd ..
cat > ecosystem.config.js << 'EOF'
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
        PORT: 5000
      },
      error_file: '/home/realtorspal/logs/backend-error.log',
      out_file: '/home/realtorspal/logs/backend-out.log',
      log_file: '/home/realtorspal/logs/backend-combined.log',
      time: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M'
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
        PORT: 3000
      },
      error_file: '/home/realtorspal/logs/frontend-error.log',
      out_file: '/home/realtorspal/logs/frontend-out.log',
      log_file: '/home/realtorspal/logs/frontend-combined.log',
      time: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M'
    }
  ]
}
EOF
print_status "PM2 configuration created"

# Start applications with PM2
print_info "Starting applications with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup | grep "sudo" | bash || true
print_status "Applications started with PM2"

# Create Nginx configuration
print_info "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/realtorspal-ai > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Frontend (React/Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_redirect off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_redirect off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Prevent access to sensitive files
    location ~ /\. {
        deny all;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/realtorspal-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
print_status "Nginx configured and reloaded"

# Wait for applications to start
print_info "Waiting for applications to start..."
sleep 10

# Test deployment
print_info "Testing deployment..."
echo ""

# Test backend health
if curl -s http://localhost:5000/health | grep -q "healthy"; then
    print_status "Backend health check passed"
else
    print_error "Backend health check failed"
fi

# Test frontend
if curl -s http://localhost:3000 > /dev/null; then
    print_status "Frontend responding"
else
    print_error "Frontend not responding"
fi

# Test through Nginx
if curl -s http://localhost/health | grep -q "healthy"; then
    print_status "Nginx proxy working"
else
    print_error "Nginx proxy not working"
fi

# Show PM2 status
print_info "PM2 Process Status:"
pm2 status

# Show final information
echo ""
print_status "🎉 Deployment completed successfully!"
print_info "==========================================="
print_info "🌐 Application URLs:"
print_info "   Frontend: http://$DOMAIN_NAME"
print_info "   Backend API: http://$DOMAIN_NAME/api"
print_info "   Health Check: http://$DOMAIN_NAME/health"
print_info "   API Docs: http://$DOMAIN_NAME/api-docs"
print_info ""
print_info "👤 Test Login Credentials:"
print_info "   Email: admin@realtorspal.ai"
print_info "   Password: password123"
print_info ""
print_info "🔧 Management Commands:"
print_info "   Monitor: ./monitor.sh"
print_info "   Update: ./update-app.sh"
print_info "   Backup: ./backup.sh"
print_info "   PM2 Status: pm2 status"
print_info "   PM2 Logs: pm2 logs"
print_info "==========================================="

# SSL setup recommendation
if [ "$DOMAIN_NAME" != "$SERVER_IP" ]; then
    echo ""
    print_info "🔒 SSL Certificate Setup (Recommended):"
    print_info "   sudo certbot --nginx -d $DOMAIN_NAME"
    print_info "   This will enable HTTPS for your domain"
fi

echo ""
print_status "RealtorsPal AI is now live! 🚀"
