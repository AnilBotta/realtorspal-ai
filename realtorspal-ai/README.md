# 🏡 RealtorsPal AI - Smart Real Estate CRM

## 🚀 Enterprise-Grade Real Estate CRM with AI Automation

RealtorsPal AI is a comprehensive real estate Customer Relationship Management (CRM) system powered by advanced AI agents. Built with modern technologies, it provides real estate professionals with intelligent lead management, automated follow-ups, and data-driven insights.

![RealtorsPal AI Dashboard](https://img.shields.io/badge/Status-Production%20Ready-green)
![Next.js](https://img.shields.io/badge/Next.js-15.3.2-blue)
![Express.js](https://img.shields.io/badge/Express.js-4.18.2-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## ✨ Key Features

### 🤖 AI-Powered Automation
- **5 Specialized AI Agents**: Lead Generator, Nurturing Agent, Content Creator, Market Analyst, Document Processor
- **6 AI Models Supported**: GPT-4, GPT-3.5 Turbo, Claude 3, Claude Instant, Gemini Pro, Gemini Pro Vision
- **Intelligent Lead Scoring**: Automatic prioritization based on engagement and potential
- **Automated Follow-ups**: AI-generated emails, SMS, and call scheduling

### 📊 Complete Lead Management
- **Kanban Pipeline**: Visual lead progression through 5 stages (New → Contacted → Appointment → Onboarded → Closed)
- **Lead Import/Export**: CSV/Excel integration with field mapping
- **Advanced Search & Filtering**: Multi-criteria lead discovery
- **Real-time Analytics**: Conversion rates, pipeline health, agent performance

### 📞 Communication Tools
- **Voice Calling**: Twilio integration with click-to-call from lead cards
- **Email Campaigns**: Automated drip campaigns and personalized messaging
- **SMS Integration**: Text messaging with templates and automation
- **Call Logging**: Duration tracking and conversation notes

### 🏗️ Enterprise Architecture
- **Secure Authentication**: JWT tokens with bcrypt password hashing
- **Real-time Database**: Neon PostgreSQL with connection pooling
- **RESTful API**: 20+ endpoints with comprehensive documentation
- **Responsive Design**: Mobile-first design with glassmorphism UI

## 🏗️ Project Structure

```
realtorspal-ai/
├── frontend/                 # Next.js React Application
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # React Components
│   │   │   ├── dashboard/   # Dashboard & Kanban Board
│   │   │   ├── auth/        # Authentication Forms
│   │   │   ├── agents/      # AI Agent Configuration
│   │   │   ├── analytics/   # Reporting & Analytics
│   │   │   ├── voice/       # Voice Calling Interface
│   │   │   └── ui/          # shadcn/ui Components
│   │   ├── contexts/        # React Contexts
│   │   ├── hooks/           # Custom React Hooks
│   │   └── lib/             # Utilities & API Client
│   └── public/              # Static Assets
│
├── backend/                 # Express.js API Server
│   ├── api/
│   │   └── server.js        # Main Server Application
│   ├── vercel.json          # Vercel Deployment Config
│   ├── railway.json         # Railway Deployment Config
│   └── render.yaml          # Render Deployment Config
│
└── deployment/              # Deployment Resources
    ├── DEPLOYMENT.md        # Deployment Guide
    └── docker/              # Docker Configurations
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Bun (preferred) or npm
- PostgreSQL database (Neon recommended)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/your-username/realtorspal-ai.git
cd realtorspal-ai
```

### 2. Frontend Setup
```bash
cd realtorspal-ai
bun install
cp .env.local.example .env.local
# Edit .env.local with your backend URL
bun run dev
```

### 3. Backend Setup
```bash
cd realtorspal-backend
npm install
cp .env.example .env
# Edit .env with your database credentials and secrets
npm start
```

### 4. Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_VERSION=11.0.0
```

#### Backend (.env)
```env
DATABASE_URL=postgresql://your-neon-connection-string
JWT_SECRET=your-super-secure-jwt-secret-32-chars-minimum
CORS_ORIGIN=http://localhost:3000,https://your-frontend-domain.com
NODE_ENV=production
```

## 🌐 Production Deployment

### Frontend Deployment
- **Recommended**: Netlify or Vercel
- **Build Command**: `bun run build`
- **Output Directory**: `out/`

### Backend Deployment Options

#### Option 1: Railway.app (Recommended)
1. Visit [railway.app/new](https://railway.app/new)
2. Connect GitHub repository
3. Set environment variables
4. Deploy automatically

#### Option 2: Render.com
1. Visit [render.com/new/web](https://render.com/new/web)
2. Connect repository
3. Use included `render.yaml` configuration

#### Option 3: Vercel (Serverless)
```bash
cd realtorspal-backend
npx vercel --prod
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📊 Database Schema

### Core Tables
- **users**: User authentication and profiles
- **leads**: Lead management and pipeline
- **voice_calls**: Call logs and recordings
- **ai_agents**: AI agent configurations
- **analytics_events**: Performance tracking
- **properties**: Property listings and details
- **campaigns**: Marketing campaign management

## 🔐 Security Features

- **JWT Authentication**: 24-hour token expiry with refresh capability
- **Password Security**: bcrypt hashing with 12 salt rounds
- **Rate Limiting**: 1000 requests per 15 minutes per IP
- **CORS Protection**: Configurable origin whitelist
- **Input Validation**: SQL injection and XSS prevention
- **Audit Logging**: Comprehensive action tracking

## 🧪 API Documentation

### Authentication Endpoints
```
POST /api/auth/login          # User login
POST /api/auth/register       # User registration
GET  /api/auth/me            # Current user info
POST /api/auth/logout        # User logout
```

### Lead Management
```
GET  /api/leads              # List leads with filtering
POST /api/leads              # Create new lead
PUT  /api/leads/:id          # Update lead
PUT  /api/leads/:id/stage    # Update lead stage
DELETE /api/leads/:id        # Soft delete lead
```

### Analytics & Reporting
```
GET /api/analytics/dashboard  # Dashboard KPIs
GET /api/analytics/funnel     # Conversion funnel
GET /api/analytics/agents     # Agent performance
```

### Voice Integration
```
POST /api/calls/initiate     # Start phone call
GET  /api/calls/:id/status   # Get call status
POST /api/calls/:id/end      # End phone call
```

Visit `/api-docs` endpoint for interactive API documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Health Check**: Visit `/health` endpoint
- **API Docs**: Visit `/api-docs` endpoint
- **Issues**: GitHub Issues tab

## 🎯 Roadmap

- [ ] Multi-tenant support for real estate agencies
- [ ] Advanced AI model fine-tuning
- [ ] Mobile app development
- [ ] Integration with MLS systems
- [ ] Advanced reporting and BI dashboard
- [ ] Webhook automation system

## 🏆 Tech Stack

### Frontend
- **Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: React Contexts + Custom Hooks
- **Build Tool**: Turbopack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL (Neon serverless)
- **Authentication**: JWT + bcrypt
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston structured logging

### DevOps
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions ready
- **Deployment**: Vercel, Railway, Render.com
- **Monitoring**: Built-in health checks

---

<div align="center">

**🏡 Built with ❤️ for Real Estate Professionals**

[Demo](https://same-dti5u6vmxdi-latest.netlify.app) • [Documentation](./DEPLOYMENT.md) • [API Docs](https://your-backend-url.com/api-docs)

</div>
