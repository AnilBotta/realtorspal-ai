#!/bin/bash

# RealtorsPal AI - Linode Server Setup Script
# Run this script on a fresh Ubuntu 22.04 LTS Linode server

set -e  # Exit on any error

echo "🚀 RealtorsPal AI - Linode Server Setup"
echo "======================================="

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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

print_info "Starting server setup for RealtorsPal AI..."

# Update system
print_info "Updating system packages..."
apt update && apt upgrade -y
print_status "System updated successfully"

# Install essential packages
print_info "Installing essential packages..."
apt install -y curl wget git unzip software-properties-common ufw nginx certbot python3-certbot-nginx htop
print_status "Essential packages installed"

# Install Node.js 18 LTS
print_info "Installing Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
print_status "Node.js $(node --version) installed"

# Install PM2 globally
print_info "Installing PM2 process manager..."
npm install -g pm2
print_status "PM2 $(pm2 --version) installed"

# Create application user
print_info "Creating application user 'realtorspal'..."
if id "realtorspal" &>/dev/null; then
    print_warning "User 'realtorspal' already exists"
else
    adduser --disabled-password --gecos "" realtorspal
    usermod -aG sudo realtorspal
    print_status "User 'realtorspal' created successfully"
fi

# Setup directories
print_info "Setting up application directories..."
sudo -u realtorspal mkdir -p /home/realtorspal/logs
sudo -u realtorspal mkdir -p /home/realtorspal/backups
print_status "Directories created"

# Configure firewall
print_info "Configuring UFW firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
print_status "Firewall configured and enabled"

# Configure Nginx
print_info "Configuring Nginx..."
rm -f /etc/nginx/sites-enabled/default
systemctl enable nginx
print_status "Nginx configured"

# Install Bun for the realtorspal user
print_info "Installing Bun package manager for realtorspal user..."
sudo -u realtorspal bash -c 'curl -fsSL https://bun.sh/install | bash'
print_status "Bun installed for realtorspal user"

# Create log rotation configuration
print_info "Setting up log rotation..."
cat > /etc/logrotate.d/realtorspal-ai << EOF
/home/realtorspal/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 realtorspal realtorspal
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
print_status "Log rotation configured"

# Create update script
print_info "Creating application update script..."
cat > /home/realtorspal/update-app.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Updating RealtorsPal AI..."

cd /home/realtorspal/realtorspal-ai

# Backup current version
echo "📦 Creating backup..."
tar -czf /home/realtorspal/backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz .

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Update backend dependencies
echo "🔧 Updating backend..."
cd realtorspal-backend
npm install --production

# Update frontend dependencies and build
echo "🎨 Updating frontend..."
cd ../realtorspal-ai
/home/realtorspal/.bun/bin/bun install
/home/realtorspal/.bun/bin/bun run build

# Restart applications
echo "🔄 Restarting applications..."
pm2 restart all

echo "✅ Update completed successfully!"
pm2 status
EOF

chown realtorspal:realtorspal /home/realtorspal/update-app.sh
chmod +x /home/realtorspal/update-app.sh
print_status "Update script created"

# Create monitoring script
print_info "Creating monitoring script..."
cat > /home/realtorspal/monitor.sh << 'EOF'
#!/bin/bash

echo "📊 RealtorsPal AI System Status"
echo "=============================="

echo -e "\n🖥️  System Resources:"
echo "Memory Usage:"
free -h
echo -e "\nDisk Usage:"
df -h /
echo -e "\nCPU Load:"
uptime

echo -e "\n🔄 PM2 Processes:"
pm2 status

echo -e "\n🌐 Nginx Status:"
systemctl is-active nginx

echo -e "\n🔥 UFW Firewall Status:"
ufw status

echo -e "\n📊 Recent Application Logs (last 10 lines):"
echo "Backend logs:"
tail -5 /home/realtorspal/logs/backend-combined.log 2>/dev/null || echo "No backend logs found"
echo -e "\nFrontend logs:"
tail -5 /home/realtorspal/logs/frontend-combined.log 2>/dev/null || echo "No frontend logs found"

echo -e "\n🌐 Health Check:"
curl -s http://localhost:5000/health | grep -q "healthy" && echo "✅ Backend healthy" || echo "❌ Backend unhealthy"
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend responsive" || echo "❌ Frontend not responding"
EOF

chown realtorspal:realtorspal /home/realtorspal/monitor.sh
chmod +x /home/realtorspal/monitor.sh
print_status "Monitoring script created"

# Create backup script
print_info "Creating backup script..."
cat > /home/realtorspal/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/realtorspal/backups"
APP_DIR="/home/realtorspal/realtorspal-ai"
DATE=$(date +%Y%m%d-%H%M%S)

echo "📦 Creating backup for RealtorsPal AI..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create application backup
tar -czf "$BACKUP_DIR/app-backup-$DATE.tar.gz" -C "$APP_DIR" .

# Keep only last 7 backups
cd $BACKUP_DIR
ls -t app-backup-*.tar.gz | tail -n +8 | xargs -r rm

echo "✅ Backup created: app-backup-$DATE.tar.gz"
echo "📊 Available backups:"
ls -lh app-backup-*.tar.gz 2>/dev/null || echo "No backups found"
EOF

chown realtorspal:realtorspal /home/realtorspal/backup.sh
chmod +x /home/realtorspal/backup.sh
print_status "Backup script created"

# Set up cron jobs
print_info "Setting up automated tasks..."
sudo -u realtorspal crontab -l 2>/dev/null | grep -v "realtorspal" > /tmp/crontab_temp || true
echo "0 2 * * * /home/realtorspal/backup.sh >> /home/realtorspal/logs/backup.log 2>&1" >> /tmp/crontab_temp
echo "*/15 * * * * /home/realtorspal/monitor.sh >> /home/realtorspal/logs/monitor.log 2>&1" >> /tmp/crontab_temp
sudo -u realtorspal crontab /tmp/crontab_temp
rm /tmp/crontab_temp
print_status "Automated tasks configured"

# Create environment template
print_info "Creating environment template..."
cat > /home/realtorspal/.env.template << 'EOF'
# RealtorsPal AI Backend Environment Configuration
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://neondb_owner:npg_lewydJ4hqDk9@ep-small-flower-aflk9tdv-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=realtorspal_super_secure_jwt_secret_key_production_2024_32_chars_minimum
CORS_ORIGIN=http://YOUR_SERVER_IP,https://YOUR_DOMAIN.com
LOG_LEVEL=info
EOF

chown realtorspal:realtorspal /home/realtorspal/.env.template
print_status "Environment template created"

print_status "✅ Server setup completed successfully!"
print_info "======================================"
print_info "Next steps:"
print_info "1. Switch to realtorspal user: sudo su - realtorspal"
print_info "2. Clone the repository: git clone https://github.com/AnilBotta/realtorspal-ai.git"
print_info "3. Configure environment variables"
print_info "4. Deploy the application"
print_info "======================================"

echo -e "\n🎉 ${GREEN}RealtorsPal AI server setup complete!${NC}"
echo -e "${BLUE}Server IP: $(curl -s ifconfig.me)${NC}"
echo -e "${BLUE}Available scripts in /home/realtorspal/:${NC}"
echo -e "  📦 backup.sh - Create application backups"
echo -e "  🔄 update-app.sh - Update application"
echo -e "  📊 monitor.sh - Monitor system status"
