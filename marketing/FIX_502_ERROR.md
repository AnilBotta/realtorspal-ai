# Fix for 502 Bad Gateway Error on Vercel Deployment

## 🐛 Issue Identified

The 502 Bad Gateway error was caused by Next.js `rewrites` configuration trying to proxy API calls through Vercel's infrastructure during build/render time.

## ✅ What Was Fixed

### 1. **Removed Problematic Rewrites**

**Before (causing 502):**
```javascript
// next.config.js
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'https://realtorspal-crm.preview.emergentagent.com/api/:path*',
    },
  ];
}
```

**After (direct API calls):**
```javascript
// next.config.js - No rewrites
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}
```

### 2. **Updated vercel.json**

Removed the rewrites configuration from `vercel.json` as well.

### 3. **How It Works Now**

The frontend will make direct API calls to your backend using the environment variable:
- Frontend uses: `process.env.NEXT_PUBLIC_API_URL`
- API calls go directly to: `https://realtorspal-crm.preview.emergentagent.com/api`

This is already configured in `/app/marketing/lib/auth-api.ts`:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://realtorspal-crm.preview.emergentagent.com/api'
```

## 🚀 Redeploy Instructions

### Option 1: Automatic Redeployment (GitHub Connected)

1. **Commit and push the changes:**
   ```bash
   cd /app/marketing
   git add .
   git commit -m "Fix 502 error: Remove rewrites, use direct API calls"
   git push origin main
   ```

2. **Vercel will automatically redeploy**
   - Check your Vercel dashboard for the new deployment
   - Wait for build to complete (~2-3 minutes)

### Option 2: Manual Redeploy via Vercel CLI

```bash
cd /app/marketing
vercel --prod
```

### Option 3: Trigger Redeploy from Vercel Dashboard

1. Go to your Vercel project dashboard
2. Click "Deployments" tab
3. Click "Redeploy" on the latest deployment
4. Select "Use existing Build Cache" → No (to ensure fresh build)
5. Click "Redeploy"

## 🔧 Verify Environment Variables in Vercel

**CRITICAL**: Make sure these environment variables are set in Vercel:

1. Go to: Project → Settings → Environment Variables
2. Add/Verify:
   ```
   NEXT_PUBLIC_API_URL=https://realtorspal-crm.preview.emergentagent.com/api
   ```

3. Make sure it's enabled for:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

## 🧪 Testing After Redeployment

### 1. **Test Landing Page**
Visit: `https://your-app.vercel.app/`
- Should load without errors
- Check browser console for errors (F12)

### 2. **Test Signup**
1. Go to: `https://your-app.vercel.app/signup`
2. Fill the form:
   - Email: `test@example.com`
   - Password: `Test1234` (min 8 chars)
   - First Name: `Test`
   - Last Name: `User`
3. Submit
4. Check browser Network tab:
   - Should see POST to `https://realtorspal-crm.preview.emergentagent.com/api/auth/signup`
   - Should get 200 OK response
   - Should redirect to CRM dashboard

### 3. **Test Login**
1. Go to: `https://your-app.vercel.app/login`
2. Use credentials from signup
3. Submit
4. Should redirect to CRM dashboard

## 🔍 Troubleshooting

### Issue: Still getting 502 error after redeployment

**Check 1: Environment Variables**
- Verify `NEXT_PUBLIC_API_URL` is set in Vercel
- Make sure there are no typos
- Ensure it's enabled for Production environment

**Check 2: Backend is accessible**
```bash
curl https://realtorspal-crm.preview.emergentagent.com/api/health
# Should return: {"status":"ok"}
```

**Check 3: CORS**
If you see CORS errors in browser console, the backend CORS is already set to `allow_origins=["*"]`, so this should not be an issue.

**Check 4: Build Logs**
- Check Vercel build logs for any errors
- Look for failed API calls during build

### Issue: API calls return 404

**Solution**: Make sure the API URL doesn't have a trailing slash:
```
✅ Correct: https://realtorspal-crm.preview.emergentagent.com/api
❌ Wrong: https://realtorspal-crm.preview.emergentagent.com/api/
```

### Issue: CORS errors in browser console

**Solution**: Update backend CORS to include your Vercel domain:

In `/app/backend/server.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Already set, but you can be more specific:
        # "https://your-vercel-app.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then restart backend:
```bash
sudo supervisorctl restart backend
```

## ✅ Success Indicators

After successful redeployment, you should see:

1. ✅ Landing page loads without errors
2. ✅ No 502 errors in browser
3. ✅ Forms are interactive
4. ✅ Signup creates new user (returns JWT tokens)
5. ✅ Login authenticates user
6. ✅ User redirects to CRM dashboard after auth
7. ✅ Browser console shows successful API calls

## 📊 Expected Build Output

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (9/9)

Route (app)                              Size     First Load JS
┌ ○ /                                    50 kB           154 kB
├ ○ /login                               3.18 kB         107 kB
├ ○ /pricing                             2.94 kB         107 kB
├ ○ /signup                              3.13 kB         107 kB
└ ○ /terms                               142 B          87.4 kB
```

## 🎯 Architecture After Fix

```
User Browser
    ↓
Vercel (Marketing Site - Static Pages)
    ↓
Direct HTTPS Request
    ↓
FastAPI Backend (draft-activity-mgr.preview.emergentagent.com/api)
    ↓
MongoDB
```

**No more proxy/rewrite layer** - This eliminates the 502 error source.

## 📝 Files Changed

1. `/app/marketing/next.config.js` - Removed rewrites
2. `/app/marketing/vercel.json` - Removed rewrites
3. This guide - `/app/marketing/FIX_502_ERROR.md`

## 🔄 Next Steps

1. Commit and push changes
2. Wait for Vercel to redeploy
3. Test the site (landing, signup, login)
4. Verify API calls work
5. You're done! 🎉

---

**Need Help?**
- Check Vercel deployment logs
- Check browser console (F12 → Console tab)
- Check Network tab for failed requests
- Verify backend is running: `curl https://realtorspal-crm.preview.emergentagent.com/api/health`
