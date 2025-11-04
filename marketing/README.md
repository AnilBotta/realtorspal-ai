# RealtorsPal AI CRM - Marketing Landing Page

A high-converting Next.js marketing site for RealtorsPal AI CRM, inspired by modern SaaS landing pages like TriggerVox. Built with TypeScript, Tailwind CSS, and shadcn/ui components.

## 🎯 Features

- **Modern Landing Page** - Hero section with animated UI showcase
- **Product Showcase** - Real CRM screenshots displaying features
- **Pricing Page** - 3-tier pricing with monthly/annual toggle
- **Authentication Flow** - Login and signup pages (ready for Emergent Auth integration)
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Performance Optimized** - Next.js 14 with App Router for optimal performance
- **SEO Ready** - Metadata and Open Graph tags configured

## 📂 Project Structure

```
/app/marketing/
├── app/
│   ├── layout.tsx           # Root layout with navbar & footer
│   ├── page.tsx             # Landing page (Hero, Features, FAQ, etc.)
│   ├── pricing/
│   │   └── page.tsx         # Pricing page with 3 plans
│   ├── login/
│   │   └── page.tsx         # Login page
│   ├── signup/
│   │   └── page.tsx         # Signup page with 14-day trial
│   ├── privacy/
│   │   └── page.tsx         # Privacy policy
│   ├── terms/
│   │   └── page.tsx         # Terms of service
│   └── globals.css          # Global styles with Tailwind
├── components/
│   ├── navbar.tsx           # Sticky navbar with smooth scroll
│   ├── footer.tsx           # Footer with links
│   └── ui/                  # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       └── accordion.tsx
├── lib/
│   └── utils.ts             # Utility functions
├── public/
│   └── images/              # CRM screenshots
│       ├── crm_dashboard.jpeg
│       ├── crm_ai_agents.jpeg
│       └── crm_analytics.jpeg
├── .env.local               # Environment variables
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
└── package.json             # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Yarn package manager
- Access to the existing React CRM (runs on port 3000)

### Installation

1. Navigate to the marketing directory:
   ```bash
   cd /app/marketing
   ```

2. Install dependencies (already done):
   ```bash
   yarn install
   ```

3. Start the development server:
   ```bash
   yarn dev
   ```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

## 🎨 Design System

### Colors

- **Primary**: `#6C5CE7` (Violet/Indigo)
- **Secondary**: `#0A0F1F` (Deep Navy)
- **Accent**: `#22D3EE` (Teal/Cyan)
- **Background**: Soft slate/white for light mode

### Typography

- **Font**: Inter (Google Fonts)
- **Scale**: Responsive with Tailwind's default scale

## 📄 Pages Overview

### 1. Landing Page (`/`)

Sections:
- **Hero** - Main headline with CRM dashboard screenshot
- **Outcome Highlights** - 4 key value propositions
- **How It Works** - 3-step process
- **Product Features** - Detailed feature showcase with screenshots
- **Smart Knowledge** - AI capability highlight
- **Integrations** - Logo cloud of supported integrations
- **FAQ** - Accordion with common questions
- **Closing CTA** - Final conversion section

### 2. Pricing Page (`/pricing`)

- **3 Plans**: Starter ($99/mo), Standard ($299/mo), Enterprise (Custom)
- **Monthly/Annual Toggle**: Save 17% on annual plans
- **Feature Comparison Table**: Detailed comparison of all plans
- **14-day free trial** highlighted on all plans

### 3. Login Page (`/login`)

- Email/Password authentication form
- "Remember me" checkbox
- Forgot password link
- Social login placeholders (Google, GitHub)
- Link to signup page

### 4. Signup Page (`/signup`)

- Comprehensive signup form (name, email, company, password)
- **14-day free trial** emphasis
- List of trial benefits
- Terms acceptance checkbox
- Link to login page

### 5. Privacy & Terms Pages

- Placeholder content for legal pages
- Clean, readable layout

## 🔐 Authentication Integration

The login and signup pages are currently **placeholders** that redirect to the existing React CRM dashboard. To implement full Emergent Authentication:

### Steps to Integrate:

1. **Install Emergent Integration Package**:
   ```bash
   pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
   ```

2. **Backend API Endpoints** (already exist in FastAPI):
   - `POST /api/auth/login`
   - `POST /api/auth/signup`
   - `POST /api/auth/refresh`
   - `GET /api/auth/me`

3. **Update Login/Signup Pages**:
   - Replace placeholder `handleSubmit` functions
   - Call backend API endpoints
   - Store JWT tokens in httpOnly cookies
   - Redirect to `/dashboard` on success

4. **Environment Variables**:
   Already configured in `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=https://draft-activity-mgr.preview.emergentagent.com/api
   EMERGENT_LLM_KEY=sk-emergent-7751d34B226BdCc8f8
   ```

### Emergent Auth Playbook

A comprehensive authentication playbook was provided by the integration agent covering:
- JWT token management
- Password hashing with bcrypt
- Session handling
- Token refresh logic
- Protected routes

## 🌐 Deployment

### Option 1: Deploy as Separate Service (Recommended)

Run Next.js on port 3001 and configure nginx/ingress to route:
- `/`, `/pricing`, `/login`, `/signup` → Next.js (port 3001)
- `/dashboard`, `/leads`, `/agents`, etc. → React CRM (port 3000)

### Option 2: Build as Static Export

```bash
# Build static files
yarn build

# Copy to React public directory
cp -r out/* /app/frontend/public/landing/

# Update React router to serve these routes
```

### Supervisor Configuration (if running alongside existing CRM)

Add to supervisor config:
```ini
[program:marketing]
command=yarn start
directory=/app/marketing
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/marketing.err.log
stdout_logfile=/var/log/supervisor/marketing.out.log
```

## 🔧 Environment Variables

Required in `.env.local`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=https://draft-activity-mgr.preview.emergentagent.com/api

# Emergent LLM Key (for future AI features)
EMERGENT_LLM_KEY=sk-emergent-7751d34B226BdCc8f8

# Site URL (for SEO and redirects)
NEXT_PUBLIC_SITE_URL=https://draft-activity-mgr.preview.emergentagent.com
```

## 📸 Screenshots

The marketing site uses **real CRM screenshots**:

1. **Dashboard** (`/public/images/crm_dashboard.jpeg`)
   - Live metrics tiles
   - Lead pipeline Kanban board
   - 5 stages: Prospecting, Engagement, Active, Closing, Closed

2. **AI Agents** (`/public/images/crm_ai_agents.jpeg`)
   - Agent status cards
   - Live activity stream
   - 6 active AI agents

3. **Analytics** (`/public/images/crm_analytics.jpeg`)
   - Conversion funnel
   - Key performance metrics
   - Stage performance insights

## 🎯 User Flow

```
Landing Page (/)
    ↓
[User clicks "Start Free Trial" or "Login"]
    ↓
Signup Page (/signup) ← → Login Page (/login)
    ↓
[14-day free trial signup - no credit card]
    ↓
[Redirect to existing React CRM]
    ↓
Dashboard (/dashboard)
```

## 🧪 Testing

### Manual Testing

1. **Landing Page**:
   - ✅ Hero section loads with CRM screenshot
   - ✅ All sections visible (Features, How It Works, FAQ)
   - ✅ Smooth scroll navigation works
   - ✅ CTAs link to signup page

2. **Pricing Page**:
   - ✅ 3 pricing cards displayed
   - ✅ Monthly/Annual toggle works
   - ✅ "Most Popular" badge on Standard plan
   - ✅ Feature comparison table visible

3. **Login/Signup Pages**:
   - ✅ Forms validate inputs
   - ✅ Submit redirects to CRM dashboard
   - ✅ Links between login/signup work

### Automated Testing (Future)

Add Playwright or Cypress tests for:
- E2E user flows
- Form validations
- Navigation
- Responsive design

## 📦 Dependencies

### Core
- `next`: ^14.2.0 - React framework
- `react`: ^18.3.0 - UI library
- `react-dom`: ^18.3.0 - React DOM renderer
- `typescript`: ^5.3.0 - Type safety

### UI & Styling
- `tailwindcss`: ^3.4.0 - Utility-first CSS
- `@radix-ui/*`: Various - Accessible UI primitives
- `lucide-react`: ^0.356.0 - Icon library
- `framer-motion`: ^11.0.0 - Animation library

### Utilities
- `next-seo`: ^6.5.0 - SEO management
- `class-variance-authority`: ^0.7.0 - Component variants
- `clsx` & `tailwind-merge`: Utility functions

## 🚧 Next Steps

### Phase 1: Complete Authentication (High Priority)
- [ ] Implement Emergent Auth API calls
- [ ] Add JWT token management
- [ ] Implement session persistence
- [ ] Add protected route middleware

### Phase 2: Subscription Flow (High Priority)
- [ ] Integrate Stripe for payments
- [ ] Add subscription management
- [ ] Implement 14-day trial logic
- [ ] Create billing portal integration

### Phase 3: Content Enhancement (Medium Priority)
- [ ] Add more customer testimonials
- [ ] Create case study pages
- [ ] Add blog/resources section
- [ ] Implement live demo booking

### Phase 4: Analytics & Optimization (Medium Priority)
- [ ] Add Google Analytics
- [ ] Implement conversion tracking
- [ ] A/B testing setup
- [ ] Performance monitoring

### Phase 5: Advanced Features (Low Priority)
- [ ] Multi-language support
- [ ] Advanced SEO optimization
- [ ] Progressive Web App features
- [ ] Offline mode support

## 📝 Notes

- **Port 3001**: Marketing site runs here (React CRM is on 3000)
- **Real Screenshots**: Uses actual CRM screenshots for authenticity
- **Placeholder Auth**: Login/signup currently redirect to CRM without actual auth
- **Responsive**: Fully responsive design for mobile/tablet/desktop
- **Accessible**: Built with Radix UI for WCAG compliance

## 🤝 Support

For questions or issues:
- Contact: support@realtorspal.com
- Documentation: (Add link when available)

## 📄 License

Proprietary - RealtorsPal AI CRM

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
