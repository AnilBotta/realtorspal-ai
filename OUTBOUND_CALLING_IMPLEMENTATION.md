# Twilio Outbound Voice Calling - Implementation Guide

## Overview
Implemented direct outbound voice calling from the Leads page using Twilio's REST API. When a user clicks the "Call" button, the system initiates a phone call from the configured Twilio phone number directly to the lead's phone number.

## Implementation Details

### Backend Changes (`/app/backend/server.py`)

**New Endpoint: `/api/twilio/outbound-call`**
```python
@app.post("/api/twilio/outbound-call")
async def initiate_outbound_call(call_data: TwilioWebRTCCallRequest):
    """Initiate a direct outbound call using Twilio - Simple phone-to-phone call"""
```

**Features:**
- Uses Twilio REST API directly via HTTP requests
- Authenticates with Account SID and Auth Token
- Validates and formats phone numbers (adds + prefix if missing)
- Sends inline TwiML for the call message
- Returns call SID and status for tracking
- Logs call activity in lead notes

**Required Credentials:**
- Twilio Account SID
- Twilio Auth Token  
- Twilio Phone Number

### Frontend Changes

**1. `/app/frontend/src/components/SimpleWebRTCCall.jsx`**
- Updated to call `/api/twilio/outbound-call` endpoint
- Changed UI labels from "WebRTC Call via REST API" to "Direct Outbound Call"
- Updated success messages to show from/to phone numbers
- Displays Call SID and status information

**2. `/app/frontend/src/components/CommunicationModal.jsx`**
- Updated modal title to "Outbound Call (Simple)"
- Changed button label from "WebRTC (Simple)" to "Outbound (Simple)"
- Updated description: "Direct outbound call - Lead receives call from your Twilio number"

## How It Works

### Call Flow:
1. User clicks "Call" button on Leads page
2. Call modal opens with three options:
   - **Voice Bridge** - Lead receives call, hears message, then connected to agent's phone
   - **Outbound (Simple)** - Direct outbound call from Twilio number to lead
   - **WebRTC (Full)** - Browser-based calling with microphone/speakers
3. User selects "Outbound (Simple)" (default)
4. User clicks the green call button
5. Backend makes POST request to Twilio API:
   ```
   POST https://api.twilio.com/2010-04-01/Accounts/{AccountSID}/Calls.json
   ```
6. Twilio initiates call with inline TwiML message
7. Lead receives call and hears the message
8. Call activity logged in lead notes

### TwiML Message:
```xml
<Response>
  <Say voice="alice">
    Hello, this is a call from your real estate agent. 
    They will be with you shortly.
  </Say>
  <Pause length="2"/>
  <Say>Please hold.</Say>
</Response>
```

## Testing Results

### Test Call Details:
- **From:** +1XXXXXXXXXX (Twilio Number)
- **To:** +1XXXXXXXXXX (Lead Phone)
- **Account SID:** ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- **Call SID:** CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- **Status:** 201 Created (Success)
- **Call Status:** queued → processing → in-progress

### Backend Logs:
```
🔵 Initiating outbound call:
   From: +1XXXXXXXXXX (Twilio)
   To: +1XXXXXXXXXX (Lead)
   Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Making API call to Twilio...
   Response Status: 201
✅ Call initiated successfully!
   Call SID: CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Status: queued
```

## Configuration

## Twilio Configuration (Sensitive Info Policy)

> 🚫 **Never commit real credentials.**  
> ✅ Store secrets via **Admin → Integrations → Twilio**, which writes to MongoDB `secrets` (encrypted).  
> ✅ For local debugging, use a `.env` file that is git-ignored.

**Placeholders to use in docs/snippets (do NOT paste real keys):**
- Account SID: `<TWILIO_ACCOUNT_SID>` (e.g., `AC-PLACEHOLDER`)
- Auth Token: `<TWILIO_AUTH_TOKEN>`
- API Key: `<TWILIO_API_KEY>` (e.g., `SK-PLACEHOLDER`)
- API Secret: `<TWILIO_API_SECRET>`
- From Number: `<TWILIO_FROM_NUMBER>`
- TwiML App SID: `<TWIML_APP_SID>`

### Server Usage

All Twilio usage must be server-side and load credentials at runtime:

```python
from backend.setup_twiml_app import get_twilio_client

client = get_twilio_client()
# Example: place a call or send SMS from the server only
# client.calls.create(...)
# client.messages.create(to="<E164_NUMBER>", from_="<E164_NUMBER>", body="Hi!")
```

### Local Development (env only, not committed)

Create `.env` (git-ignored) with placeholders, then set real values only on your machine:

```bash
TWILIO_ACCOUNT_SID=<TWILIO_ACCOUNT_SID>
TWILIO_AUTH_TOKEN=<TWILIO_AUTH_TOKEN>
TWILIO_API_KEY=<TWILIO_API_KEY>
TWILIO_API_SECRET=<TWILIO_API_SECRET>
MONGO_URL=<YOUR_MONGO_URL>
APP_ENCRYPTION_KEY=<BASE64_32BYTE_KEY>
```

### Production

- Use the **Admin UI** to save Twilio credentials
- They are encrypted and stored in MongoDB `secrets` collection
- The backend reads them dynamically
- No secrets ship to the client or live in git history

### Required Settings (Admin UI):
1. **Twilio Account SID** - Your Twilio account identifier
2. **Twilio Auth Token** - Authentication token for API calls
3. **Twilio Phone Number** - Your Twilio phone number (format: +1XXXXXXXXXX)
4. **Agent Phone Number** - Your phone for receiving bridged calls

### Current Configuration Example:
```
Account SID: <TWILIO_ACCOUNT_SID> (stored encrypted in database)
Phone Number: <TWILIO_FROM_NUMBER> (stored encrypted in database)
Agent Phone: <AGENT_PHONE_NUMBER> (stored encrypted in database)
```

## Customization Options

### Modify Call Message:
Edit the TwiML in `/app/backend/server.py` line 965:
```python
twiml = '<Response><Say voice="alice">YOUR CUSTOM MESSAGE HERE</Say></Response>'
```

### Available TwiML Actions:
- `<Say>` - Text-to-speech message
- `<Play>` - Play audio file
- `<Dial>` - Connect to another number
- `<Pause>` - Add silence
- `<Gather>` - Collect DTMF input
- `<Record>` - Record the call

### Voice Options:
- alice (female, US)
- Polly voices (e.g., Joanna, Matthew, Amy)

## Error Handling

### Common Errors:
1. **Missing Credentials** - "Missing Twilio credentials: [list]"
   - Solution: Configure credentials in Settings page

2. **No Phone Number** - "Lead has no phone number"
   - Solution: Add phone number to lead profile

3. **Invalid Phone Format** - Auto-corrects by adding + prefix

4. **API Error** - Returns Twilio error message
   - Solution: Check account balance, phone number verification

## Lead Activity Logging

Each successful call adds a note to the lead:
```
[Outbound Call] Initiated from +1XXXXXXXXXX to +1XXXXXXXXXX - Call SID: CAxxxx... - 2025-10-14T19:03:04
```

## API Response Format

### Success Response:
```json
{
  "status": "success",
  "call_sid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "message": "Call initiated successfully! Calling +1XXXXXXXXXX from +1XXXXXXXXXX",
  "call_status": "queued",
  "from_number": "+1XXXXXXXXXX",
  "to_number": "+1XXXXXXXXXX"
}
```

### Error Response:
```json
{
  "status": "error",
  "message": "Failed to initiate call: [error details]"
}
```

## Advantages of This Implementation

1. **Simple & Reliable** - Uses Twilio's proven REST API
2. **No Browser Permissions** - No microphone/speaker access needed
3. **Works Everywhere** - Compatible with all devices and browsers
4. **Easy Setup** - Only requires 3 credentials (SID, Token, Phone)
5. **Scalable** - Can handle high call volumes
6. **Trackable** - Returns Call SID for status tracking
7. **Professional** - Calls come from business phone number

## Future Enhancements

### Potential Features:
1. **Call Status Tracking** - Poll Twilio for call status updates
2. **Call Recording** - Add `<Record>` to TwiML
3. **Call Forwarding** - Dial agent's phone after lead answers
4. **IVR Menu** - Add `<Gather>` for interactive menus
5. **Voicemail Detection** - Handle answering machines
6. **Call Analytics** - Track duration, cost, outcomes
7. **Scheduled Calls** - Queue calls for specific times
8. **Call Scripts** - Dynamic TwiML based on lead data

## Documentation References

- [Twilio REST API Calls Documentation](https://www.twilio.com/docs/voice/make-calls)
- [TwiML Voice Reference](https://www.twilio.com/docs/voice/twiml)
- [Twilio Python SDK](https://www.twilio.com/docs/libraries/python)

## Support

For issues or questions:
1. Check Twilio Console for call logs and errors
2. Review backend logs: `/var/log/supervisor/backend.out.log`
3. Verify phone numbers are in E.164 format (+1XXXXXXXXXX)
4. Ensure Twilio account has sufficient balance
5. Confirm phone numbers are verified in Twilio Console

---

**Status:** ✅ Implemented and Tested Successfully
**Last Updated:** October 14, 2025
