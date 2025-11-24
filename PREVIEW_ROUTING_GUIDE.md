# RealtorsPal Preview Environment - Routing Guide

## Overview
The preview environment now runs **both** the Next.js marketing site and the React CRM app simultaneously using nginx as a reverse proxy.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Nginx (Port 80)                     │
│              Reverse Proxy & Router                  │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Marketing   │ │   React CRM  │ │   Backend    │
│   Next.js    │ │   Dashboard  │ │   FastAPI    │
│  Port 3001   │ │  Port 3000   │ │  Port 8001   │
└──────────────┘ └──────────────┘ └──────────────┘
```

## URL Routing

### Marketing Site (Next.js - Port 3001)
- **`/`** - Landing page
- **`/login`** - Login page
- **`/signup`** - Signup page
- **`/pricing`** - Pricing page
- **`/privacy`** - Privacy policy
- **`/terms`** - Terms of service
- **`/_next/*`** - Next.js static assets
- **`/images/*`** - Marketing site images

### CRM Dashboard (React - Port 3000)
- **`/dashboard`** - Main CRM dashboard (redirected after login/signup)
- **`/static/*`** - React static assets

### Backend API (FastAPI - Port 8001)
- **`/api/*`** - All backend API endpoints

## User Flow

1. **Landing**: User visits root `/` → sees Next.js marketing page
2. **Authentication**: User clicks "Login" or "Start Free Trial" → goes to `/login` or `/signup`
3. **Dashboard Access**: After successful auth → redirected to `/dashboard` (React CRM)

## Configuration Files

### Supervisor Configuration
- **Main config**: `/etc/supervisor/conf.d/supervisord.conf` (readonly)
- **Marketing config**: `/etc/supervisor/conf.d/marketing.conf` (custom)

### Nginx Configuration
- **Active config**: `/etc/nginx/sites-available/realtorspal`
- **Symlink**: `/etc/nginx/sites-enabled/realtorspal`

### Environment Variables

#### Marketing Site (`/app/marketing/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://realtor-dashboard-3.preview.emergentagent.com/api
NEXT_PUBLIC_SITE_URL=https://realtor-dashboard-3.preview.emergentagent.com
```

#### Frontend CRM (`/app/frontend/.env`)
```env
REACT_APP_BACKEND_URL=https://realtor-dashboard-3.preview.emergentagent.com
```

## Service Management

### Check Status
```bash
sudo supervisorctl status
```

### Restart Services
```bash
# Restart marketing site
sudo supervisorctl restart marketing

# Restart React CRM
sudo supervisorctl restart frontend

# Restart backend
sudo supervisorctl restart backend

# Restart all
sudo supervisorctl restart all
```

### Reload Nginx
```bash
sudo nginx -t  # Test configuration
sudo service nginx reload
```

### View Logs
```bash
# Marketing site logs
tail -f /var/log/supervisor/marketing.out.log
tail -f /var/log/supervisor/marketing.err.log

# Frontend logs
tail -f /var/log/supervisor/frontend.out.log

# Backend logs
tail -f /var/log/supervisor/backend.out.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Development Workflow

### Making Changes to Marketing Site
```bash
cd /app/marketing
# Edit files...
yarn build
sudo supervisorctl restart marketing
```

### Making Changes to React CRM
```bash
cd /app/frontend
# Edit files...
# Hot reload is enabled, no restart needed
```

### Making Changes to Backend
```bash
cd /app/backend
# Edit files...
# Hot reload is enabled, but restart if adding new dependencies
sudo supervisorctl restart backend
```

## Troubleshooting

### Marketing site not loading
1. Check if service is running: `sudo supervisorctl status marketing`
2. Check logs: `tail -50 /var/log/supervisor/marketing.err.log`
3. Rebuild: `cd /app/marketing && yarn build`
4. Restart: `sudo supervisorctl restart marketing`

### CRM dashboard not accessible at /dashboard
1. Check nginx config: `sudo nginx -t`
2. Check React app: `sudo supervisorctl status frontend`
3. Check nginx logs: `tail -50 /var/log/nginx/error.log`

### API calls failing
1. Check backend status: `sudo supervisorctl status backend`
2. Check backend logs: `tail -50 /var/log/supervisor/backend.err.log`
3. Verify API URL in environment variables

## Important Notes

1. **Preview URL**: The preview environment URL remains the same for all components
2. **Hot Reload**: Both frontend and backend have hot reload enabled
3. **Marketing Build**: Marketing site requires rebuild after changes (`yarn build`)
4. **Nginx Priority**: Route order in nginx matters - most specific routes first
5. **Static Assets**: Make sure ` /_next` and `/static` routes are correctly proxied

## Production Deployment

### Vercel (Marketing Site)
The marketing site is deployed separately to Vercel at: `realtorspal-ai.vercel.app`

### Preview Environment
The preview environment shows the integrated setup with both marketing and CRM.
