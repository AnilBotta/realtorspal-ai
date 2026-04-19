# Deployment Guide — RealtorsPal AI

Target stack: **MongoDB Atlas** (database) + **Render.com** (FastAPI backend) + **Vercel** (CRM + marketing frontends). All tiers are free; no credit card needed for Atlas M0 or Render free.

Total time: ~45 minutes.

---

## Step 0 — Prep

1. Push the repo to GitHub (if you haven't already).
2. Make sure you have:
   - GitHub account linked
   - A strong random JWT secret — generate one now:
     ```powershell
     python -c "import secrets; print(secrets.token_urlsafe(48))"
     ```
     Save the output; you'll paste it into Render.

---

## Step 1 — MongoDB Atlas (free 512 MB cluster)

1. Go to https://www.mongodb.com/cloud/atlas/register — sign up with Google or email (no credit card).
2. **Create a deployment** → choose **M0 Free** → region closest to you → name the cluster `realtorspal` → **Create**.
3. **Security Quickstart** dialog:
   - **Username:** `realtorspal_app`
   - **Password:** click *Autogenerate Secure Password* → **copy it to your clipboard** (you won't see it again). Save it somewhere safe for a minute.
   - Click **Create User**.
   - **Where would you like to connect from:** choose **My Local Environment** → **Add My Current IP Address** (you'll relax this in step 1.5).
   - Click **Finish and Close**.
4. Wait ~2 minutes for the cluster to provision.
5. **Allow Render to reach Atlas:** in the left sidebar → **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) → Confirm. This is fine for M0 because the username/password is the real gate.
6. **Get the connection string:** left sidebar → **Database** → click **Connect** on your cluster → **Drivers** → Driver = Python, Version = 3.12 or later → copy the connection string. It looks like:
   ```
   mongodb+srv://realtorspal_app:<db_password>@realtorspal.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=realtorspal
   ```
   Replace `<db_password>` with the password you copied in step 3. Save the full string — this is your `MONGO_URL`.

---

## Step 2 — Render.com (FastAPI backend)

1. Go to https://render.com → sign up with GitHub.
2. **New +** → **Web Service** → connect your GitHub → pick `realtorspal-ai` → **Connect**.
3. Settings:
   - **Name:** `realtorspal-api`
   - **Region:** Oregon (or closest)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free
4. Scroll to **Environment Variables** → **Add Environment Variable** for each:

   | Key | Value |
   |---|---|
   | `PYTHON_VERSION` | `3.11.9` |
   | `MONGO_URL` | *(paste the full Atlas connection string from Step 1.6)* |
   | `DB_NAME` | `realtorspal` |
   | `JWT_SECRET_KEY` | *(paste the random 64-char secret from Step 0)* |
   | `CORS_ORIGINS` | `http://localhost:3000` *(placeholder; you'll update this after Vercel deploys)* |
   | `LOG_LEVEL` | `info` |

   Leave Twilio / SendGrid / Emergent keys empty for now — those features auto-disable when unset.
5. Click **Create Web Service**. Build takes 3–5 min.
6. Once it shows **Live**, copy the URL shown at the top — e.g. `https://realtorspal-api.onrender.com`. This is your `BACKEND_URL`.
7. Test it:
   ```powershell
   curl https://realtorspal-api.onrender.com/api/health
   ```
   Expected: `{"status":"ok",...}` (first request may take ~30s while the free instance cold-starts).

---

## Step 3 — Vercel: CRM (frontend)

1. Go to https://vercel.com → sign up with GitHub.
2. **Add New** → **Project** → import `realtorspal-ai`.
3. Settings:
   - **Project Name:** `realtorspal-crm`
   - **Framework Preset:** Create React App *(should auto-detect)*
   - **Root Directory:** click **Edit** → select `frontend` → Continue
   - **Build & Output Settings:** leave as-is (the `frontend/vercel.json` covers it)
   - **Environment Variables:** add one:

     | Name | Value |
     |---|---|
     | `REACT_APP_BACKEND_URL` | `https://realtorspal-api.onrender.com` |

4. Click **Deploy**. Takes 2–3 min.
5. Copy the deployment URL — e.g. `https://realtorspal-crm.vercel.app`.

---

## Step 4 — Vercel: Marketing site

1. Vercel dashboard → **Add New** → **Project** → import the same repo again.
2. Settings:
   - **Project Name:** `realtorspal-marketing`
   - **Framework Preset:** Next.js *(auto-detected)*
   - **Root Directory:** `marketing`
   - **Environment Variables:**

     | Name | Value |
     |---|---|
     | `NEXT_PUBLIC_API_URL` | `https://realtorspal-api.onrender.com` |

3. Click **Deploy**. Copy the URL — e.g. `https://realtorspal-marketing.vercel.app`.

---

## Step 5 — Wire CORS back to Render

Now that you have both Vercel URLs, tell the backend to accept them.

1. Render dashboard → `realtorspal-api` → **Environment** tab.
2. Edit `CORS_ORIGINS` to be a comma-separated list (no trailing slashes, no spaces):
   ```
   https://realtorspal-crm.vercel.app,https://realtorspal-marketing.vercel.app
   ```
3. Click **Save Changes**. Render auto-redeploys in ~1 min.

---

## Step 6 — Smoke test

Run these in order:

```powershell
# 1. Backend health
curl https://realtorspal-api.onrender.com/api/health

# 2. Marketing HTML (should return Next.js bundle tags, NOT empty)
curl -sL https://realtorspal-marketing.vercel.app/ | Select-String -Pattern "<script|<link"

# 3. CRM HTML (should return CRA bundle tags)
curl -sL https://realtorspal-crm.vercel.app/ | Select-String -Pattern "<script|<link"
```

Browser tests:

1. Open the **marketing URL** → click **Sign Up** → create a test account with a real email → you should get redirected into the CRM and see the Dashboard with no red console errors.
2. Open the **CRM URL** directly → demo-login kicks in → Dashboard loads → click **Leads** → data loads.
3. Open Atlas **Database** → **Browse Collections** on the `realtorspal` cluster → you should see `users`, `leads`, `settings` documents created by the signup + demo flows.

---

## Step 7 (optional) — Custom domain

If you want `realtorspal.syncai.tech` on the marketing site:

1. Vercel → `realtorspal-marketing` → **Settings** → **Domains** → add `realtorspal.syncai.tech`.
2. Vercel shows a CNAME record (e.g. `cname.vercel-dns.com.`).
3. In your DNS provider for `syncai.tech`, add that CNAME for the `realtorspal` subdomain.
4. Wait for propagation (minutes–hours). Vercel auto-issues the TLS cert.
5. Add the custom domain to `CORS_ORIGINS` on Render if signup will happen on that hostname.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Marketing site shows empty body, only `<title>` | `NEXT_PUBLIC_API_URL` unset in Vercel | Step 4 env var |
| CRM `/leads` returns 404 on refresh | SPA rewrite missing | `frontend/vercel.json` has it — redeploy |
| Login fails with "Failed to fetch" | `CORS_ORIGINS` on Render doesn't include the frontend origin | Step 5 |
| Backend first request takes 30s | Render free tier cold start after 15 min idle | Upgrade to Render Starter ($7/mo) or add a keep-alive pinger |
| `Invalid credentials` on a fresh signup | Atlas user password has `@` or `/` — breaks the SRV URI | Regenerate with alphanumeric-only password in Atlas |

---

## What's intentionally disabled in v1

- **Emergent LLM fallback** — set `EMERGENT_LLM_KEY` in Render env if you have one; otherwise the app uses per-user OpenAI keys that users paste into Settings.
- **Twilio voice/SMS** — set the 6 `TWILIO_*` vars in Render to enable.
- **SendGrid email** — set `SENDGRID_API_KEY` + `SENDGRID_FROM_EMAIL` in Render to enable.

All three feature groups gracefully no-op when unset.
