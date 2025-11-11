# RealtorsPal Marketing Site - Access Guide

## 🌐 How to Access the Marketing Site

The Next.js marketing site is running on **port 3001** and is currently only accessible within the local environment.

### Current Setup:

- **Marketing Site (Next.js)**: `http://localhost:3001`
- **CRM Dashboard (React)**: `https://realtorspal-crm.preview.emergentagent.com`
- **Backend API (FastAPI)**: `https://realtorspal-crm.preview.emergentagent.com/api`

### Access Methods:

#### 1. **Via SSH/Terminal (Direct Access)**
If you have terminal access to the server:
```bash
# Test the site is running
curl http://localhost:3001

# Test signup API
curl -X POST https://realtorspal-crm.preview.emergentagent.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","first_name":"Test","last_name":"User"}'
```

#### 2. **Configure Public Access (Recommended for Testing)**

To make the marketing site publicly accessible, you have two options:

**Option A: Update Nginx Configuration**

Add routing rules to serve the marketing site on the main domain:

```nginx
# Route marketing pages to Next.js (port 3001)
location ~ ^/(pricing|login|signup|privacy|terms)$ {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# Route root path to Next.js
location = / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# Keep existing React CRM routes
location ~ ^/(dashboard|leads|agents|analytics) {
    proxy_pass http://localhost:3000;
    ...
}
```

**Option B: Deploy on Separate Subdomain**

Deploy the marketing site on a subdomain like `www.draft-activity-mgr.preview.emergentagent.com`:

```bash
# Update Next.js config with public URL
# Then deploy with supervisor or as a separate service
```

## 🧪 Testing Authentication Flow

### 1. **Test Backend APIs (Already Working!)**

```bash
# Signup
curl -X POST https://realtorspal-crm.preview.emergentagent.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123",
    "first_name": "John",
    "last_name": "Doe",
    "company": "Acme Realty"
  }'

# Expected Response:
{
  "user": {
    "id": "...",
    "email": "newuser@example.com",
    "name": "John Doe"
  },
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "bearer"
}

# Login
curl -X POST https://realtorspal-crm.preview.emergentagent.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123"
  }'
```

### 2. **Test Frontend (Once Publicly Accessible)**

1. Navigate to landing page: `http://your-domain/`
2. Click "Start Free Trial" → Goes to `/signup`
3. Fill out signup form:
   - Email: `test@example.com`
   - Password: `Test1234` (minimum 8 characters)
   - First Name: `Test`
   - Last Name: `User`
   - Company: `Test Co`
4. Submit form → Creates account and redirects to CRM dashboard
5. Or navigate to `/login` and use existing credentials

## 🚀 Deployment Options

### Option 1: Quick Test with Port Forwarding

```bash
# Forward port 3001 to your local machine
ssh -L 3001:localhost:3001 user@server

# Then access http://localhost:3001 in your browser
```

### Option 2: Update Supervisor to Bind to 0.0.0.0

Update `/app/marketing/package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 3001 -H 0.0.0.0",
    "start": "next start -p 3001 -H 0.0.0.0"
  }
}
```

Then restart:
```bash
cd /app/marketing
pkill -f "next dev"
yarn dev
```

### Option 3: Build and Serve Statically

```bash
cd /app/marketing
yarn build
yarn start  # Starts production server on port 3001
```

## 📋 Verification Checklist

- [ ] Marketing site accessible at root `/`
- [ ] Pricing page loads at `/pricing`
- [ ] Login page loads at `/login`
- [ ] Signup page loads at `/signup`
- [ ] Signup form submits successfully
- [ ] User is redirected to CRM dashboard after signup/login
- [ ] Backend auth APIs working (signup, login, me)
- [ ] Tokens stored correctly in localStorage
- [ ] CRM dashboard accessible after authentication

## 🔍 Troubleshooting

**Issue**: "Site can't be reached" or "Connection refused"
- **Solution**: The marketing site is only accessible locally. Configure public access using one of the deployment options above.

**Issue**: Signup/Login doesn't redirect to dashboard
- **Check**: Browser console for JavaScript errors
- **Check**: Network tab to see if API call succeeded
- **Verify**: Backend API is responding at `/api/auth/signup` and `/api/auth/login`

**Issue**: CORS errors
- **Solution**: Add CORS headers to FastAPI backend for the Next.js origin

**Issue**: 404 on API calls
- **Check**: `.env.local` has correct `NEXT_PUBLIC_API_URL`
- **Verify**: Backend is running and accessible

## 📞 Support

For issues or questions:
- Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
- Check Next.js logs: `tail -f /tmp/nextjs.log`
- Verify processes: `ps aux | grep "next dev"`
- Test API directly: Use curl commands above

## ✅ Current Status

- ✅ Backend authentication APIs fully functional
- ✅ Frontend auth integration complete
- ✅ JWT token management implemented
- ✅ Signup/Login forms working
- ⚠️ Marketing site accessible only locally (port 3001)
- ⏳ Pending: Public URL configuration

**Next Action**: Configure public access to test the complete user flow from landing page → signup → CRM dashboard.
