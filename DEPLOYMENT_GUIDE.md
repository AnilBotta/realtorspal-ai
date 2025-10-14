# RealtorsPal AI CRM - Secure Deployment Guide

## 🔒 Security Notice

This codebase does NOT contain any API keys or credentials. All sensitive information is stored securely in:
- **Database** (MongoDB `settings` collection)
- **Environment Variables** (`.env` files - not in Git)

## 📋 Required Credentials

Before deploying, you need to obtain the following credentials:

### Twilio (Voice Calling & SMS)
1. **Account SID** - From [Twilio Console](https://console.twilio.com)
2. **Auth Token** - From Twilio Console Dashboard
3. **Phone Number** - Purchase from Twilio Console → Phone Numbers
4. **API Key & Secret** - Create at Console → Account → API Keys & Tokens
5. **Agent Phone Number** - Your personal phone for receiving calls

### SendGrid (Email)
1. **API Key** - From [SendGrid Console](https://app.sendgrid.com) → Settings → API Keys
2. **Verified Sender Email** - Verify at SendGrid → Settings → Sender Authentication

## 🚀 Deployment Steps

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd realtorspal-crm
```

### 2. Setup Backend Environment
```bash
cd backend
cp .env.example .env  # Create from template
```

Edit `backend/.env`:
```env
MONGO_URL=mongodb://127.0.0.1:27017
REACT_APP_BACKEND_URL=https://your-domain.com
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Setup Frontend Environment
```bash
cd frontend
cp .env.example .env  # Create from template
```

Edit `frontend/.env`:
```env
REACT_APP_BACKEND_URL=https://your-domain.com
```

### 4. Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
yarn install
```

### 5. Create TwiML Application (One-time setup)
```bash
cd backend

# Set credentials as environment variables
export TWILIO_ACCOUNT_SID="ACxxxxx"
export TWILIO_AUTH_TOKEN="xxxxx"

# Run setup script
python setup_twiml_app.py

# Save the returned TwiML App SID to backend/.env
```

### 6. Configure Secrets in UI

Start the application and navigate to **Settings** page:

#### Twilio Configuration
- Account SID: `ACxxxxx`
- Auth Token: `xxxxx`
- Phone Number: `+1234567890`
- WhatsApp Number: `+1234567890` (optional)
- API Key SID: `SKxxxxx`
- API Secret: `xxxxx`
- Agent Phone Number: `+1234567890` (your phone)

#### SendGrid Configuration
- API Key: `SG.xxxxx`
- Verified Sender Email: `your-email@domain.com`

Click **Save Settings** to store in database.

### 7. Start Services
```bash
# Development
cd backend && uvicorn server:app --reload
cd frontend && yarn start

# Production
sudo supervisorctl start all
```

## 📁 Environment Files

### `.env.example` Template (Backend)
```env
MONGO_URL=mongodb://127.0.0.1:27017
REACT_APP_BACKEND_URL=https://your-domain.com
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### `.env.example` Template (Frontend)
```env
REACT_APP_BACKEND_URL=https://your-domain.com
```

**Important:** Never commit `.env` files to Git!

## 🗄️ Database Schema

Credentials are stored in MongoDB:

```javascript
// Collection: settings
{
  _id: ObjectId("..."),
  user_id: "user-uuid",
  
  // Twilio
  twilio_account_sid: "ACxxxxx",
  twilio_auth_token: "xxxxx",
  twilio_phone_number: "+1234567890",
  twilio_api_key: "SKxxxxx",
  twilio_api_secret: "xxxxx",
  twilio_twiml_app_sid: "APxxxxx",
  agent_phone_number: "+1234567890",
  
  // SendGrid
  sendgrid_api_key: "SG.xxxxx",
  sender_email: "your-email@domain.com"
}
```

## 🔐 Security Best Practices

✅ All API keys stored in database or environment variables  
✅ `.env` files in `.gitignore`  
✅ No hardcoded credentials in code  
✅ Password fields in UI for sensitive inputs  
✅ User-level credential isolation  
✅ Environment-specific configuration  

## 🧪 Testing

After configuration, test the features:

1. **Outbound Calling:**
   - Go to Dashboard → Click "Call" on any lead
   - Select "Outbound (Simple)"
   - Click call button
   - Lead receives call, bridges to your agent phone

2. **Email Sending:**
   - Click "Email" on any lead
   - Compose and send
   - Verify email arrives

3. **SMS:**
   - Click "SMS" on any lead
   - Send test message

## 📚 Documentation

- [Security Hardening Details](./SECURITY_HARDENING.md)
- [Outbound Calling Guide](./OUTBOUND_CALLING_IMPLEMENTATION.md)
- [SendGrid Integration](./SENDGRID_IMPLEMENTATION.md)

## ❓ Troubleshooting

### "Missing credentials" Error
- Check Settings page has all fields filled
- Verify credentials are saved in database
- Restart backend service

### Calls Not Connecting
- Verify Twilio phone number is active
- Check agent_phone_number is correct
- Ensure sufficient Twilio account balance

### Emails Not Sending
- Verify SendGrid API key is valid
- Confirm sender email is verified in SendGrid
- Check SendGrid account is active

## 📞 Support

For issues:
1. Check application logs: `/var/log/supervisor/backend.out.log`
2. Verify database settings: `db.settings.findOne({user_id: "..."})`
3. Test credentials directly in Twilio/SendGrid console

---

**Ready to deploy securely!** 🚀🔒
