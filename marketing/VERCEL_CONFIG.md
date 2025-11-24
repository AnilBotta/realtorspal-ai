# Marketing Site - Vercel Configuration Guide

## Backend Integration Fixed

The marketing site now properly connects to the RealtorsPal CRM backend. After login/signup, users are redirected to the CRM dashboard.

## Environment Variables for Vercel

To deploy the marketing site on Vercel with proper backend connectivity, configure these environment variables in your Vercel project:

### Required Variables

1. Go to your Vercel project settings: https://vercel.com/dashboard
2. Navigate to: **Settings → Environment Variables**
3. Add the following:

```env
NEXT_PUBLIC_API_URL=https://realtorspal.syncai.tech
```

**Important Notes:**
- Do **NOT** include `/api` at the end - it will be added automatically
- The code now ensures `/api` is appended if not present
- You can set either `https://realtorspal.syncai.tech` or `https://realtorspal.syncai.tech/api` (both work)

### What This Does

- **`NEXT_PUBLIC_API_URL`**: Points to the backend API endpoint
  - For your production: `https://realtorspal.syncai.tech`
  - The `/api` prefix is automatically added by the auth client

## How Authentication Works Now

### 1. API URL Detection (Smart)
The marketing site now automatically detects the environment:

- **Localhost**: Uses `http://localhost:8001/api`
- **Preview environment**: Uses current hostname + `/api`
- **Vercel**: Uses `NEXT_PUBLIC_API_URL` (must be configured)
- **Fallback**: Uses preview backend URL

### 2. Login/Signup Flow

**Preview Environment (localhost or preview.emergentagent.com)**:
```
User logs in → Backend authenticates → Redirect to /dashboard
```

**Vercel Deployment (vercel.app)**:
```
User logs in → Backend authenticates → Redirect to full CRM URL
https://realtorspal.syncai.tech/dashboard
```

The CRM URL is automatically derived from `NEXT_PUBLIC_API_URL`

### 3. Token Storage
After successful authentication:
- `access_token` stored in localStorage
- `refresh_token` stored in localStorage  
- `user` object stored in localStorage

The CRM app reads these tokens to maintain the session.

## Testing the Integration

### Test Account Created
```
Email: test@realtorspal.com
Password: testpass123
```

### Test Flow

1. **Visit marketing site**: 
   - Preview: http://localhost:3001
   - Vercel: https://realtorspal-ai.vercel.app

2. **Click "Login"**

3. **Enter credentials**:
   - Email: test@realtorspal.com
   - Password: testpass123

4. **Verify**:
   - Login succeeds (no "Failed to fetch" error)
   - Redirects to CRM dashboard
   - User is logged into the CRM

## CORS Configuration

The backend already allows CORS from all origins (`CORS_ORIGINS=*`). If you need to restrict this in production:

**Backend `.env`:**
```env
CORS_ORIGINS=https://realtorspal-ai.vercel.app,https://your-custom-domain.com
```

## Troubleshooting

### Issue: "Failed to fetch" error on Vercel

**Solution**: 
1. Check Vercel environment variables are set
2. Verify `NEXT_PUBLIC_API_URL` is correct
3. Rebuild and redeploy on Vercel

### Issue: CORS errors

**Solution**:
1. Check backend `CORS_ORIGINS` includes your Vercel URL
2. Verify the API URL doesn't have trailing slashes

### Issue: Login works but redirect fails

**Solution**:
1. Check browser console for errors
2. Verify tokens are stored in localStorage
3. Check CRM dashboard is accessible directly

## Production Deployment Checklist

- [ ] Set `NEXT_PUBLIC_API_URL` in Vercel environment variables
- [ ] Update backend `CORS_ORIGINS` to include Vercel URL
- [ ] Test login flow end-to-end
- [ ] Verify token storage and CRM access
- [ ] Test signup flow
- [ ] Verify redirect to CRM dashboard works

## Files Modified

1. `/app/marketing/lib/auth-api.ts` - Smart API URL detection
2. `/app/marketing/app/login/page.tsx` - Intelligent redirect logic
3. `/app/marketing/app/signup/page.tsx` - Intelligent redirect logic

## Next Steps

1. **Configure Vercel variables** as described above
2. **Redeploy** your Vercel site
3. **Test** the login flow from Vercel
4. **Update** the API URL if you deploy to a custom backend domain
