# RealtorsPal Marketing Site - Vercel Deployment Guide

## ✅ Build Fixed!

All ESLint errors have been resolved. The marketing site is now ready for Vercel deployment.

## 🚀 Deployment Steps

### 1. **Prepare the Repository**

The marketing site is located in `/app/marketing`. For Vercel deployment, you need to:

**Option A: Deploy from Subdirectory**
```bash
# In your GitHub repository settings, make sure the marketing folder is pushed
git add .
git commit -m "Add marketing site"
git push origin main
```

Then in Vercel:
- Set **Root Directory** to: `marketing`

**Option B: Create Separate Repository (Recommended)**
```bash
# Create a new repository for the marketing site
cd /app/marketing
git init
git add .
git commit -m "Initial commit - RealtorsPal Marketing Site"
git remote add origin <your-new-repo-url>
git push -u origin main
```

### 2. **Vercel Configuration**

Create a `vercel.json` in the marketing directory (already exists):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://realtor-dashboard-3.preview.emergentagent.com/api",
    "NEXT_PUBLIC_SITE_URL": "https://your-domain.vercel.app"
  }
}
```

### 3. **Environment Variables in Vercel Dashboard**

Go to your Vercel project → Settings → Environment Variables and add:

```
NEXT_PUBLIC_API_URL=https://realtor-dashboard-3.preview.emergentagent.com/api
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
EMERGENT_LLM_KEY=<your-emergent-key>
```

### 4. **Deploy to Vercel**

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from the marketing directory
cd /app/marketing
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? realtorspal-marketing
# - Directory? ./
# - Override settings? No

# For production deployment
vercel --prod
```

### 5. **Automatic Deployments**

Connect your GitHub repository to Vercel:

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `marketing` (if deploying from subdirectory)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
5. Add environment variables (from step 3)
6. Click "Deploy"

## 🔧 Build Configuration

### package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint"
  }
}
```

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
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
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://realtor-dashboard-3.preview.emergentagent.com/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig
```

## 🐛 Fixed ESLint Errors

The following errors were fixed:

**1. app/login/page.tsx (Line 162)**
```tsx
// ❌ Before
Don't have an account?

// ✅ After
Don&apos;t have an account?
```

**2. app/signup/page.tsx (Line 208)**
```tsx
// ❌ Before
What's included in your trial

// ✅ After
What&apos;s included in your trial
```

**3. app/signup/page.tsx (Line 241)**
```tsx
// ❌ Before
We'll remind you before it ends

// ✅ After
We&apos;ll remind you before it ends
```

## 🧪 Verify Build Locally

Before deploying, verify the build works locally:

```bash
cd /app/marketing

# Install dependencies
npm install

# Run build
npm run build

# Start production server
npm start

# Test the production build
curl http://localhost:3001
```

## 📊 Build Output

Expected successful build output:

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (9/9)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    50 kB           154 kB
├ ○ /login                               3.18 kB         107 kB
├ ○ /pricing                             2.94 kB         107 kB
├ ○ /signup                              3.13 kB         107 kB
└ ○ /terms                               142 B          87.4 kB
```

## 🔐 CORS Configuration

After deployment, you may need to update your backend CORS settings to allow requests from your Vercel domain:

**In `/app/backend/server.py`:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-vercel-domain.vercel.app",
        "https://realtor-dashboard-3.preview.emergentagent.com",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🎯 Post-Deployment Checklist

After successful deployment:

- [ ] Marketing site accessible at Vercel URL
- [ ] Landing page loads correctly
- [ ] Pricing page displays all plans
- [ ] Login page renders properly
- [ ] Signup page shows all fields
- [ ] Form submissions work (test with real data)
- [ ] API calls to backend succeed (check browser console)
- [ ] Images load correctly (CRM screenshots)
- [ ] Navigation works (all links functional)
- [ ] Responsive design on mobile/tablet
- [ ] Dark mode toggle (if implemented)

## 🚨 Troubleshooting

### Issue: Build fails with ESLint errors
**Solution**: All apostrophes in JSX must be escaped with `&apos;`

### Issue: Images not loading
**Solution**: Ensure images are in `/public/images/` directory and properly referenced

### Issue: API calls fail (CORS)
**Solution**: Update backend CORS settings to include Vercel domain

### Issue: Environment variables not working
**Solution**: Make sure they're prefixed with `NEXT_PUBLIC_` for client-side access

### Issue: 404 on page refresh
**Solution**: This is normal for Next.js - Vercel handles routing automatically

## 📝 Custom Domain Setup

To use a custom domain (e.g., `realtorspal.com`):

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Update `NEXT_PUBLIC_SITE_URL` environment variable

## 🔄 CI/CD Pipeline

Once connected to GitHub:
- **Push to `main` branch** → Automatic production deployment
- **Pull requests** → Preview deployments
- **Commit SHA** → Unique deployment URL

## 📈 Monitoring

Vercel provides built-in monitoring:
- **Analytics**: Page views, visitor stats
- **Speed Insights**: Performance metrics
- **Logs**: Real-time function logs
- **Deployment History**: Rollback capability

## ✅ Success!

Your RealtorsPal marketing site is now:
- ✅ Built successfully (no ESLint errors)
- ✅ Ready for Vercel deployment
- ✅ Optimized for production
- ✅ SEO-ready with metadata
- ✅ Responsive and accessible
- ✅ Integrated with authentication APIs

**Deploy Command:**
```bash
cd /app/marketing && vercel --prod
```

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Support: Check Vercel dashboard logs for errors
