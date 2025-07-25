#!/bin/bash

# RealtorsPal AI - Updated Linode Installation Script
# Incorporates all manual fixes discovered during deployment
# Usage: curl -fsSL https://raw.githubusercontent.com/AnilBotta/realtorspal-ai/main/scripts/fixed-install.sh | bash

set -e

echo "🚀 RealtorsPal AI - Updated Linode Installation (With All Fixes)"
echo "==============================================================="
echo ""

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

# Check if Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    print_error "This script is designed for Ubuntu 22.04 LTS"
    print_info "Please use Ubuntu 22.04 LTS on your Linode server"
    exit 1
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root"
    print_info "Use: sudo bash or run as root user"
    exit 1
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
print_info "Detected Ubuntu $(lsb_release -rs)"
print_info "Server IP: $SERVER_IP"

# Confirm installation
echo ""
echo -e "${YELLOW}This script will:${NC}"
echo "  📦 Install Node.js, PM2, Nginx, and dependencies"
echo "  👤 Create 'realtorspal' user for the application"
echo "  🔒 Configure firewall (UFW)"
echo "  🚀 Deploy RealtorsPal AI application with all fixes"
echo "  🌐 Configure Nginx reverse proxy"
echo "  🔧 Apply all manual fixes discovered during testing"
echo ""
read -p "Continue with installation? (y/N): " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Installation cancelled"
    exit 0
fi

# Update system
print_info "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
print_info "Installing essential packages..."
apt install -y curl wget git unzip software-properties-common ufw nginx certbot python3-certbot-nginx htop

# Install Node.js 18 LTS
print_info "Installing Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 globally
print_info "Installing PM2 process manager..."
npm install -g pm2

# Create application user
print_info "Creating application user 'realtorspal'..."
if id "realtorspal" &>/dev/null; then
    print_warning "User 'realtorspal' already exists"
else
    adduser --disabled-password --gecos "" realtorspal
    usermod -aG sudo realtorspal
fi

# Setup directories
print_info "Setting up application directories..."
sudo -u realtorspal mkdir -p /home/realtorspal/logs
sudo -u realtorspal mkdir -p /home/realtorspal/backups

# Configure firewall
print_info "Configuring UFW firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Install Bun for the realtorspal user
print_info "Installing Bun package manager for realtorspal user..."
sudo -u realtorspal bash -c 'curl -fsSL https://bun.sh/install | bash'

# Clone and setup application
print_info "Cloning RealtorsPal AI repository..."
sudo -u realtorspal bash -c 'cd /home/realtorspal && git clone https://github.com/AnilBotta/realtorspal-ai.git'

# Setup backend with fixes
print_info "Setting up backend with all fixes..."
sudo -u realtorspal bash -c "
cd /home/realtorspal/realtorspal-ai/realtorspal-backend
npm install

# Create backend environment file with production settings
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://neondb_owner:npg_lewydJ4hqDk9@ep-small-flower-aflk9tdv-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=realtorspal_super_secure_jwt_secret_key_production_2024_32_chars_minimum
CORS_ORIGIN=http://$SERVER_IP,https://$SERVER_IP,http://localhost:3000
LOG_LEVEL=info
EOF
"

# Setup frontend with all discovered fixes
print_info "Setting up frontend with all discovered fixes..."
sudo -u realtorspal bash -c "
cd /home/realtorspal/realtorspal-ai/realtorspal-ai

# Install Bun and add to PATH
export PATH=\"/home/realtorspal/.bun/bin:\$PATH\"

# Install dependencies
bun install

# Fix next.config.js (remove static export, use server mode)
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  images: {
    unoptimized: true,
    domains: [
      \"source.unsplash.com\",
      \"images.unsplash.com\",
      \"ext.same-assets.com\",
      \"ugc.same-assets.com\",
    ],
    remotePatterns: [
      {
        protocol: \"https\",
        hostname: \"source.unsplash.com\",
        pathname: \"/**\",
      },
      {
        protocol: \"https\",
        hostname: \"images.unsplash.com\",
        pathname: \"/**\",
      },
      {
        protocol: \"https\",
        hostname: \"ext.same-assets.com\",
        pathname: \"/**\",
      },
      {
        protocol: \"https\",
        hostname: \"ugc.same-assets.com\",
        pathname: \"/**\",
      },
    ],
  },
};

module.exports = nextConfig;
EOF

# Fix package.json start script to bind to all interfaces
sed -i 's/\"start\": \"next start\"/\"start\": \"next start -H 0.0.0.0\"/' package.json

# Create frontend environment
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_VERSION=11.0.0
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_VOICE_CALLS=true
NEXT_PUBLIC_ENABLE_AI_AGENTS=true
EOF

# Build frontend
bun run build
"

# Create PM2 ecosystem with embedded environment variables (fix for PM2 not loading .env)
print_info "Creating PM2 configuration with embedded environment variables..."
sudo -u realtorspal bash -c "
cd /home/realtorspal/realtorspal-ai
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
"

# Start applications with PM2
print_info "Starting applications with PM2..."
sudo -u realtorspal bash -c "
cd /home/realtorspal/realtorspal-ai
pm2 start ecosystem.config.js
pm2 save
"

# Configure Nginx with proper server configuration
print_info "Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/realtorspal-ai << EOF
server {
    listen 80;
    listen [::]:80;
    server_name _;

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
ln -sf /etc/nginx/sites-available/realtorspal-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
systemctl enable nginx

# Create management scripts
print_info "Creating management scripts..."

# Update script
sudo -u realtorspal bash -c "
cat > /home/realtorspal/update-app.sh << 'EOF'
#!/bin/bash
set -e

echo \"🔄 Updating RealtorsPal AI...\"

cd /home/realtorspal/realtorspal-ai

# Backup current version
echo \"📦 Creating backup...\"
tar -czf /home/realtorspal/backups/backup-\$(date +%Y%m%d-%H%M%S).tar.gz .

# Pull latest changes
echo \"📥 Pulling latest changes...\"
git pull origin main

# Update backend dependencies
echo \"🔧 Updating backend...\"
cd realtorspal-backend
npm install --production

# Update frontend dependencies and build
echo \"🎨 Updating frontend...\"
cd ../realtorspal-ai
export PATH=\"/home/realtorspal/.bun/bin:\$PATH\"

# Apply fixes again (in case they were overwritten)
sed -i 's/\"start\": \"next start\"/\"start\": \"next start -H 0.0.0.0\"/' package.json

bun install
bun run build

# Restart applications
echo \"🔄 Restarting applications...\"
cd ..
pm2 restart all

echo \"✅ Update completed successfully!\"
pm2 status
EOF

chmod +x /home/realtorspal/update-app.sh
"

# Monitor script
sudo -u realtorspal bash -c "
cat > /home/realtorspal/monitor.sh << 'EOF'
#!/bin/bash

echo \"📊 RealtorsPal AI System Status\"
echo \"==============================\"

echo -e \"\n🖥️  System Resources:\"
echo \"Memory Usage:\"
free -h
echo -e \"\nDisk Usage:\"
df -h /
echo -e \"\nCPU Load:\"
uptime

echo -e \"\n🔄 PM2 Processes:\"
pm2 status

echo -e \"\n🌐 Nginx Status:\"
systemctl is-active nginx

echo -e \"\n🔥 UFW Firewall Status:\"
sudo ufw status

echo -e \"\n📊 Recent Application Logs (last 5 lines):\"
echo \"Backend logs:\"
tail -5 /home/realtorspal/logs/backend-combined.log 2>/dev/null || echo \"No backend logs found\"
echo -e \"\nFrontend logs:\"
tail -5 /home/realtorspal/logs/frontend-combined.log 2>/dev/null || echo \"No frontend logs found\"

echo -e \"\n🌐 Health Check:\"
curl -s http://localhost:5000/health | grep -q \"healthy\" && echo \"✅ Backend healthy\" || echo \"❌ Backend unhealthy\"
curl -s http://localhost:3000 > /dev/null && echo \"✅ Frontend responsive\" || echo \"❌ Frontend not responding\"
EOF

chmod +x /home/realtorspal/monitor.sh
"

# Wait for applications to start
print_info "Waiting for applications to start..."
sleep 15

# Test deployment
print_info "Testing deployment..."

# Test backend health
if curl -s http://localhost:5000/health | grep -q "healthy"; then
    print_status "Backend health check passed"
else
    print_warning "Backend health check failed, but continuing..."
fi

# Test frontend
if curl -s http://localhost:3000 > /dev/null; then
    print_status "Frontend responding"
else
    print_warning "Frontend not responding yet, may need more time to start..."
fi

# Test through Nginx
if curl -s http://localhost/health | grep -q "healthy"; then
    print_status "Nginx proxy working"
else
    print_warning "Nginx proxy not working yet..."
fi

# Final status
echo ""
print_status "🎉 RealtorsPal AI Installation Complete!"
print_info "============================================"
print_info "🌐 Application URLs:"
print_info "   Frontend: http://$SERVER_IP"
print_info "   Backend API: http://$SERVER_IP/api"
print_info "   Health Check: http://$SERVER_IP/health"
print_info "   API Docs: http://$SERVER_IP/api-docs"
print_info ""
print_info "👤 Test Login Credentials:"
print_info "   Email: admin@realtorspal.ai"
print_info "   Password: password123"
print_info ""
print_info "🔧 Management Commands:"
print_info "   Monitor: sudo su - realtorspal -c './monitor.sh'"
print_info "   Update: sudo su - realtorspal -c './update-app.sh'"
print_info "   PM2 Status: sudo su - realtorspal -c 'pm2 status'"
print_info "   PM2 Logs: sudo su - realtorspal -c 'pm2 logs'"
print_info ""
print_info "📊 Cost Estimate:"
print_info "   Linode 2GB: ~$10/month (recommended)"
print_info "   Linode 1GB: ~$5/month (minimum)"
print_info ""

# SSL setup recommendation
echo -e "${YELLOW}🔒 SSL Certificate Setup (Recommended):${NC}"
echo "   sudo certbot --nginx -d yourdomain.com"
echo "   This will enable HTTPS for your domain"

echo ""
print_status "RealtorsPal AI is now live with all fixes applied! 🚀"

# Show PM2 status
echo ""
print_info "Current PM2 Status:"
sudo -u realtorspal bash -c "pm2 status"
