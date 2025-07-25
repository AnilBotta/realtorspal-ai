# RealtorsPal AI Backend

Production-ready backend API for RealtorsPal AI CRM with real estate lead management, AI agents, and voice calling integration.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/realtorspal-backend)

## 🔧 Manual Deployment

### Option 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
cd realtorspal-backend
vercel --prod
```

### Option 2: GitHub Integration
1. Push this code to a GitHub repository
2. Connect the repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

## 🌍 Environment Variables

Set these in your Vercel dashboard or deployment platform:

```env
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_lewydJ4hqDk9@ep-small-flower-aflk9tdv-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=realtorspal_super_secure_jwt_secret_key_production_2024_32_chars_minimum
CORS_ORIGIN=https://same-dti5u6vmxdi-latest.netlify.app,http://localhost:3000
LOG_LEVEL=info
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Current user info

### Lead Management
- `GET /api/leads` - List leads with filtering
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `PUT /api/leads/:id/stage` - Update lead stage

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics

### Voice Calls
- `POST /api/calls/initiate` - Start phone call
- `GET /api/calls/:id/status` - Get call status
- `POST /api/calls/:id/end` - End phone call

### System
- `GET /health` - Health check
- `GET /api-docs` - API documentation

## 🗄️ Database Schema

Connected to Neon PostgreSQL with tables:
- `users` - User authentication and profiles
- `leads` - Lead management and pipeline
- `voice_calls` - Call logs and recordings
- `ai_agents` - AI agent configurations
- `analytics_events` - Performance tracking

## 🛡️ Security Features

- JWT authentication with 24h expiry
- Password hashing with bcrypt (12 rounds)
- Rate limiting (1000 requests/15 minutes)
- CORS protection
- Helmet security headers
- Input validation
- SQL injection prevention

## 🧪 Testing

### Health Check
```bash
curl https://your-deployment.vercel.app/health
```

### Login Test
```bash
curl -X POST https://your-deployment.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@realtorspal.ai","password":"password123"}'
```

### Get Leads
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://your-deployment.vercel.app/api/leads
```

## 📈 Performance

- Connection pooling (max 20 connections)
- Response compression
- Structured logging with Winston
- Graceful shutdown handling
- Error monitoring and reporting

## 🔄 Frontend Integration

Update your frontend's `src/lib/api.ts`:

```typescript
const API_BASE_URL = 'https://your-deployment.vercel.app'
```

## 📞 Support

For issues or questions:
1. Check the health endpoint: `/health`
2. Review logs in Vercel dashboard
3. Verify environment variables are set
4. Test database connectivity

---

**🎉 Production Ready**: This backend is fully tested and production-optimized with enterprise-grade security and performance.
