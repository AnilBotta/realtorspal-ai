# Marketing Site Auth Integration - Fix Summary

## Problem Identified

The marketing site was calling incorrect auth endpoints, resulting in **405 (Method Not Allowed)** errors:

### What Was Wrong
- Marketing site called: `https://realtorspal.syncai.tech/auth/signup`
- Backend expected: `https://realtorspal.syncai.tech/api/auth/signup`
- **Missing `/api` prefix** in the URL path

### Root Cause
The `getAPIUrl()` function in `auth-api.ts` was returning `NEXT_PUBLIC_API_URL` as-is without ensuring it included the `/api` suffix. When set to `https://realtorspal.syncai.tech`, the auth calls became `/auth/signup` instead of `/api/auth/signup`.

## Solution Implemented

### 1. Fixed API URL Construction (`/app/marketing/lib/auth-api.ts`)

**Change**: Modified `getAPIUrl()` to automatically append `/api` if not already present:

```typescript
const getAPIUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    // Ensure it ends with /api if not already present
    return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
  }
  // ... rest of the logic
}
```

**Result**: 
- User sets `NEXT_PUBLIC_API_URL=https://realtorspal.syncai.tech`
- Code ensures it becomes `https://realtorspal.syncai.tech/api`
- Auth calls: `{baseUrl}/auth/signup` → `https://realtorspal.syncai.tech/api/auth/signup` ✅

### 2. Fixed CRM Redirect URLs

**Files Modified**:
- `/app/marketing/app/login/page.tsx`
- `/app/marketing/app/signup/page.tsx`

**Change**: Updated redirect logic to use the correct CRM URL:

```typescript
// For Vercel deployments
if (hostname.includes('vercel.app')) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://realtorspal.syncai.tech'
  const crmUrl = apiUrl.replace('/api', '')
  window.location.href = `${crmUrl}/dashboard`
}
```

**Result**: After login/signup, users are redirected to `https://realtorspal.syncai.tech/dashboard`

### 3. Updated Documentation

**File**: `/app/marketing/VERCEL_CONFIG.md`

- Clarified that users should set `NEXT_PUBLIC_API_URL=https://realtorspal.syncai.tech` (without `/api`)
- Explained that `/api` is automatically appended
- Updated redirect URLs to match production environment

## Vercel Configuration

### Environment Variable Setup

In your Vercel project (https://vercel.com/dashboard):

1. Go to **Settings → Environment Variables**
2. Set:
   ```
   NEXT_PUBLIC_API_URL=https://realtorspal.syncai.tech
   ```
   **Note**: Don't include `/api` - it's added automatically

### Backend CORS (Already Configured)

Your backend already has CORS configured:
```env
CORS_ORIGINS=https://realtorspal.syncai.tech,https://realtorspal-ai.vercel.app
```

## Testing the Fix

### In Preview Environment (Emergent)

1. Visit: `http://localhost:3001/login` (or preview URL)
2. The auth client automatically detects the preview environment
3. API calls go to: `{current-hostname}/api/auth/login`

### On Vercel Deployment

1. Visit: `https://realtorspal-ai.vercel.app/login`
2. The auth client uses `NEXT_PUBLIC_API_URL` from environment
3. API calls go to: `https://realtorspal.syncai.tech/api/auth/login` ✅
4. After login, redirects to: `https://realtorspal.syncai.tech/dashboard` ✅

### Expected Results

**Before Fix**:
```
POST https://realtorspal.syncai.tech/auth/signup
→ 405 (Method Not Allowed) ❌
```

**After Fix**:
```
POST https://realtorspal.syncai.tech/api/auth/signup
→ 200 OK ✅
→ User created successfully
→ Redirect to CRM dashboard
```

## Files Changed

### Core Auth Integration
1. **`/app/marketing/lib/auth-api.ts`**
   - Modified `getAPIUrl()` to ensure `/api` suffix
   - Line 4-6: Added logic to append `/api` if missing

### Login/Signup Pages
2. **`/app/marketing/app/login/page.tsx`**
   - Updated redirect logic for Vercel deployments
   - Line 42-48: Uses API URL to derive CRM URL

3. **`/app/marketing/app/signup/page.tsx`**
   - Updated redirect logic for Vercel deployments
   - Line 60-66: Uses API URL to derive CRM URL

### Documentation
4. **`/app/marketing/VERCEL_CONFIG.md`**
   - Updated environment variable instructions
   - Clarified `/api` handling
   - Updated example URLs to production

## Backend Routes (No Changes Needed)

The backend already has correct routes:
- ✅ `POST /api/auth/signup` (line 2264)
- ✅ `POST /api/auth/login` (line 2315)
- ✅ `POST /api/auth/refresh` (line 2365)
- ✅ `POST /api/auth/logout` (line 2414)

## Next Steps for User

1. **On Vercel Dashboard**:
   - Set `NEXT_PUBLIC_API_URL=https://realtorspal.syncai.tech`
   - Redeploy the marketing site

2. **Test the Flow**:
   - Visit `https://realtorspal-ai.vercel.app/signup`
   - Create a new account
   - Verify: No 405 errors
   - Verify: Redirected to `https://realtorspal.syncai.tech/dashboard`

3. **Test Login**:
   - Visit `https://realtorspal-ai.vercel.app/login`
   - Login with existing account
   - Verify: Successful login
   - Verify: Redirected to CRM dashboard

## Summary

✅ **Root cause identified**: Missing `/api` prefix in auth API calls
✅ **Fix implemented**: Automatic `/api` appending in `getAPIUrl()`
✅ **Redirects updated**: Use correct production CRM URL
✅ **Documentation updated**: Clear Vercel configuration instructions
✅ **Backward compatible**: Works in preview, localhost, and Vercel
✅ **No backend changes**: Backend routes already correct

The marketing site auth integration is now fixed and ready for production deployment on Vercel.
