# RealtorsPal AI

AI-powered real estate CRM with lead management, AI agents, voice/SMS/email workflows, and analytics.

## Architecture

| Layer | Path | Tech | Deploy target |
|---|---|---|---|
| Backend API | `backend/` | FastAPI + MongoDB (Motor), APScheduler, bcrypt, PyJWT, Twilio, SendGrid, CrewAI | Render.com (free web service) |
| CRM app | `frontend/` | Create React App (React 18), axios, zustand, Tailwind, Chart.js, @twilio/voice-sdk | Vercel |
| Marketing site | `marketing/` | Next.js 14 + TS + Tailwind + Radix UI | Vercel |
| Database | — | MongoDB Atlas M0 (free tier) | Atlas |

The backend exposes everything under `/api/*`. Both frontends call the same backend via an `API URL` env var.

## Local development

```bash
# 1. Backend
cd backend
python -m venv .venv && . .venv/Scripts/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                    # fill MONGO_URL, DB_NAME, JWT_SECRET_KEY, CORS_ORIGINS
uvicorn server:app --reload --port 8001

# 2. CRM
cd frontend
npm install
cp .env.example .env                                    # REACT_APP_BACKEND_URL=http://localhost:8001
npm start                                               # http://localhost:3000

# 3. Marketing
cd marketing
npm install
cp .env.example .env.local                              # NEXT_PUBLIC_API_URL=http://localhost:8001
npm run dev                                             # http://localhost:3001
```

## Deployment

See [DEPLOY.md](DEPLOY.md) for a step-by-step MongoDB Atlas + Render + Vercel walkthrough.

## Environment variables

Each app has a `.env.example` listing exact required keys:

- [backend/.env.example](backend/.env.example)
- [frontend/.env.example](frontend/.env.example)
- [marketing/.env.example](marketing/.env.example)

## Repo layout

```
backend/        FastAPI service (server.py + feature modules)
frontend/       CRA CRM dashboard
marketing/      Next.js marketing + auth pages
```

Feature docs worth keeping:
- [OUTBOUND_CALLING_IMPLEMENTATION.md](OUTBOUND_CALLING_IMPLEMENTATION.md)
- [SECURITY_HARDENING.md](SECURITY_HARDENING.md)
- [SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md)
- [SENDGRID_IMPLEMENTATION.md](SENDGRID_IMPLEMENTATION.md)

## License

Proprietary.
