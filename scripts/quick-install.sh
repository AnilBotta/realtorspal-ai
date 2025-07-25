#!/bin/bash

# RealtorsPal AI - One-Command Linode Installation
# Usage: curl -fsSL https://raw.githubusercontent.com/AnilBotta/realtorspal-ai/main/scripts/quick-install.sh | bash

set -e

echo "🚀 RealtorsPal AI - One-Command Linode Installation"
echo "==================================================="
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

print_info "Detected Ubuntu $(lsb_release -rs)"
print_info "Server IP: $(curl -s ifconfig.me)"

# Confirm installation
echo ""
echo -e "${YELLOW}This script will:${NC}"
echo "  📦 Install Node.js, PM2, Nginx, and dependencies"
echo "  👤 Create 'realtorspal' user for the application"
echo "  🔒 Configure firewall (UFW)"
echo "  🚀 Deploy RealtorsPal AI application"
echo "  🌐 Configure Nginx reverse proxy"
echo ""
read -p "Continue with installation? (y/N): " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Installation cancelled"
    exit 0
fi

# Download and run server setup script
print_info "📥 Downloading server setup script..."
curl -fsSL -o /tmp/linode-setup.sh https://raw.githubusercontent.com/AnilBotta/realtorspal-ai/main/scripts/linode-setup.sh
chmod +x /tmp/linode-setup.sh

print_info "🔧 Running server setup..."
/tmp/linode-setup.sh

# Switch to realtorspal user and run deployment
print_info "🚀 Running application deployment..."
curl -fsSL -o /tmp/deploy-app.sh https://raw.githubusercontent.com/AnilBotta/realtorspal-ai/main/scripts/deploy-app.sh
chmod +x /tmp/deploy-app.sh
chown realtorspal:realtorspal /tmp/deploy-app.sh

# Run deployment as realtorspal user
sudo -u realtorspal /tmp/deploy-app.sh

# Cleanup
rm -f /tmp/linode-setup.sh /tmp/deploy-app.sh

# Final status
SERVER_IP=$(curl -s ifconfig.me)

echo ""
echo "🎉 RealtorsPal AI Installation Complete! 🎉"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Your RealtorsPal AI CRM is now live!${NC}"
echo ""
echo -e "${BLUE}🌐 Access your application:${NC}"
echo "   Frontend: http://$SERVER_IP"
echo "   Backend API: http://$SERVER_IP/api"
echo "   Health Check: http://$SERVER_IP/health"
echo "   API Documentation: http://$SERVER_IP/api-docs"
echo ""
echo -e "${BLUE}👤 Test Login Credentials:${NC}"
echo "   Email: admin@realtorspal.ai"
echo "   Password: password123"
echo ""
echo -e "${BLUE}🔧 Server Management:${NC}"
echo "   Switch to app user: sudo su - realtorspal"
echo "   Monitor system: sudo su - realtorspal -c './monitor.sh'"
echo "   Update application: sudo su - realtorspal -c './update-app.sh'"
echo "   View logs: sudo su - realtorspal -c 'pm2 logs'"
echo ""
echo -e "${BLUE}📊 Cost Estimate:${NC}"
echo "   Linode 2GB: ~$10/month (recommended)"
echo "   Linode 1GB: ~$5/month (minimum)"
echo ""
echo -e "${YELLOW}🔒 Next Steps (Recommended):${NC}"
echo "   1. Set up a domain name"
echo "   2. Install SSL certificate: sudo certbot --nginx -d yourdomain.com"
echo "   3. Configure domain DNS to point to: $SERVER_IP"
echo "   4. Update CORS settings for your domain"
echo ""
echo -e "${GREEN}🚀 Your enterprise real estate CRM is ready for business!${NC}"
echo ""
