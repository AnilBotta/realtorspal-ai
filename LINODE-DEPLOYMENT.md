# 🚀 RealtorsPal AI - Complete Linode Deployment Guide

## 🌐 Linode VPS Deployment Setup

This guide will deploy both frontend and backend on a single Linode server with full production configuration.

## 📋 Prerequisites

- Linode account ([linode.com](https://linode.com))
- Domain name (optional, for custom domain)
- SSH client

## 🖥️ Step 1: Create Linode Server

### Create Instance
1. **Login to Linode Cloud Manager**: [cloud.linode.com](https://cloud.linode.com)
2. **Click "Create"** → **"Linode"**
3. **Choose Configuration**:
   - **Image**: Ubuntu 22.04 LTS
   - **Region**: Choose closest to your users
   - **Plan**: Shared CPU - Nanode 1GB ($5/month) or Linode 2GB ($10/month)
   - **Root Password**: Create a strong password
   - **SSH Keys**: Add your SSH key (recommended)
4. **Click "Create Linode"**
5. **Wait** for server to boot (2-3 minutes)
6. **Note the IP address** (e.g., 192.168.1.100)

## 🔧 Step 2: Initial Server Setup

### Connect to Server
```bash
# SSH into your server (replace with your IP)
ssh root@YOUR_LINODE_IP

# Update system packages
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git unzip software-properties-common ufw nginx certbot python3-certbot-nginx
```

### Create Non-Root User
```bash
# Create new user
adduser realtorspal
usermod -aG sudo realtorspal

# Switch to new user
su - realtorspal
```

## 📦 Step 3: Install Node.js and Dependencies

```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Bun (faster package manager)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Verify installations
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
bun --version   # Should show 1.x.x
pm2 --version   # Should show 5.x.x
```

## 📁 Step 4: Clone and Setup Application

```bash
# Navigate to home directory
cd /home/realtorspal

# Clone the repository
git clone https://github.com/AnilBotta/realtorspal-ai.git
cd realtorspal-ai

# Set up backend
cd realtorspal-backend
npm install

# Create production environment file
sudo nano .env
```

### Backend Environment Configuration (.env)
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://neondb_owner:npg_lewydJ4hqDk9@ep-small-flower-aflk9tdv-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=realtorspal_super_secure_jwt_secret_key_production_2024_32_chars_minimum
CORS_ORIGIN=http://YOUR_LINODE_IP,https://YOUR_DOMAIN.com
LOG_LEVEL=info
```

### Test Backend
```bash
# Test backend locally
npm start

# In another terminal, test health endpoint
curl http://localhost:5000/health

# Stop the test
Ctrl+C
```

## 🎨 Step 5: Setup Frontend

```bash
# Navigate to frontend directory
cd /home/realtorspal/realtorspal-ai/realtorspal-ai

# Install dependencies
bun install

# Create production environment
nano .env.local
```

### Frontend Environment Configuration (.env.local)
```env
NEXT_PUBLIC_API_URL=http://YOUR_LINODE_IP:5000
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_VERSION=11.0.0
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_VOICE_CALLS=true
NEXT_PUBLIC_ENABLE_AI_AGENTS=true
```

### Build Frontend
```bash
# Build for production
bun run build

# Test build locally
bun run start

# Stop test
Ctrl+C
```

## ⚙️ Step 6: Configure PM2 Process Manager

### Create PM2 Configuration
```bash
# Create PM2 ecosystem file
cd /home/realtorspal/realtorspal-ai
nano ecosystem.config.js
```

### PM2 Configuration (ecosystem.config.js)
```javascript
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
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
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
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
}
```

### Start Applications with PM2
```bash
# Create logs directory
mkdir -p logs

# Start applications
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions to run the generated command with sudo
```

## 🌐 Step 7: Configure Nginx Reverse Proxy

### Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/realtorspal-ai
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name YOUR_LINODE_IP YOUR_DOMAIN.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend (React/Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable Nginx Configuration
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/realtorspal-ai /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔒 Step 8: Configure Firewall

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Allow specific ports if needed
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

## 🔐 Step 9: Setup SSL Certificate (Optional but Recommended)

### If you have a domain name:
```bash
# Get SSL certificate
sudo certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com

# Auto-renewal setup
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### If using IP only:
```bash
# Update frontend environment for HTTPS
cd /home/realtorspal/realtorspal-ai/realtorspal-ai
nano .env.local

# Change to:
NEXT_PUBLIC_API_URL=http://YOUR_LINODE_IP/api
```

## 🧪 Step 10: Test Deployment

### Test Backend API
```bash
# Health check
curl http://YOUR_LINODE_IP/health

# API documentation
curl http://YOUR_LINODE_IP/api-docs

# Authentication test
curl -X POST http://YOUR_LINODE_IP/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@realtorspal.ai","password":"password123"}'
```

### Test Frontend
```bash
# Visit in browser
http://YOUR_LINODE_IP

# Should show RealtorsPal AI login page
```

## 📊 Step 11: Monitoring and Maintenance

### Setup Monitoring
```bash
# Install htop for system monitoring
sudo apt install htop

# Monitor processes
htop

# Check PM2 processes
pm2 monit

# View application logs
pm2 logs realtorspal-backend
pm2 logs realtorspal-frontend

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Maintenance Scripts
```bash
# Create update script
nano /home/realtorspal/update-app.sh
```

### Update Script (update-app.sh)
```bash
#!/bin/bash
cd /home/realtorspal/realtorspal-ai

# Pull latest changes
git pull origin main

# Update backend
cd realtorspal-backend
npm install

# Update frontend
cd ../realtorspal-ai
bun install
bun run build

# Restart applications
pm2 restart all

echo "✅ Application updated successfully!"
```

```bash
# Make script executable
chmod +x /home/realtorspal/update-app.sh
```

## 🎯 Step 12: Final Configuration

### Update Frontend API URL
```bash
cd /home/realtorspal/realtorspal-ai/realtorspal-ai
nano .env.local

# Update to use relative API path
NEXT_PUBLIC_API_URL=/api
```

### Rebuild and Restart
```bash
# Rebuild frontend
bun run build

# Restart applications
pm2 restart all

# Check status
pm2 status
```

## ✅ Deployment Verification Checklist

- [ ] **Server Setup**: Ubuntu 22.04 LTS installed and updated
- [ ] **Node.js**: Version 18.x installed
- [ ] **Application**: Cloned from GitHub and dependencies installed
- [ ] **Environment**: .env files configured correctly
- [ ] **PM2**: Applications running and managed by PM2
- [ ] **Nginx**: Reverse proxy configured and running
- [ ] **Firewall**: UFW configured and enabled
- [ ] **SSL**: Certificate installed (if using domain)
- [ ] **Health Check**: `/health` endpoint responding
- [ ] **Frontend**: Login page loads correctly
- [ ] **Backend**: API endpoints working
- [ ] **Authentication**: Login with admin@realtorspal.ai works
- [ ] **Database**: Live data connections working

## 🌐 Access Your Application

**Frontend**: `http://YOUR_LINODE_IP` or `https://YOUR_DOMAIN.com`
**Backend API**: `http://YOUR_LINODE_IP/api` or `https://YOUR_DOMAIN.com/api`
**Health Check**: `http://YOUR_LINODE_IP/health`
**API Docs**: `http://YOUR_LINODE_IP/api-docs`

## 💰 Estimated Costs

- **Linode Nanode 1GB**: $5/month (good for testing)
- **Linode 2GB**: $10/month (recommended for production)
- **Domain**: $10-15/year (optional)
- **Total**: $5-10/month + domain cost

## 🆘 Troubleshooting

### Common Issues:

1. **Port Issues**: Ensure ports 3000 and 5000 are available
2. **Permission Issues**: Use `sudo` for system-level commands
3. **PM2 Issues**: Check logs with `pm2 logs`
4. **Nginx Issues**: Check config with `sudo nginx -t`
5. **Database Issues**: Verify DATABASE_URL environment variable

### Useful Commands:
```bash
# Restart everything
pm2 restart all
sudo systemctl restart nginx

# Check logs
pm2 logs
sudo tail -f /var/log/nginx/error.log

# Check processes
pm2 status
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :5000
```

---

## 🎉 Success!

Your RealtorsPal AI application is now running on Linode with:
- ✅ **Production-grade infrastructure**
- ✅ **SSL encryption** (if domain configured)
- ✅ **Process management** with PM2
- ✅ **Reverse proxy** with Nginx
- ✅ **Firewall protection**
- ✅ **Automated deployments**
- ✅ **Full monitoring capabilities**

**🚀 Your enterprise real estate CRM is live on Linode!**
