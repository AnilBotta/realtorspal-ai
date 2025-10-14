"""
Script to create or verify TwiML Application for WebRTC calling
This creates the TwiML App needed for browser-to-phone WebRTC calls
"""
import os
import sys
from twilio.rest import Client

# Get credentials from environment variables
ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://crm-partial-leads.preview.emergentagent.com')

if not ACCOUNT_SID or not AUTH_TOKEN:
    print("❌ Error: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set as environment variables")
    print("   Please set them before running this script:")
    print("   export TWILIO_ACCOUNT_SID='your_account_sid'")
    print("   export TWILIO_AUTH_TOKEN='your_auth_token'")
    sys.exit(1)

# TwiML App details
TWIML_APP_NAME = "RealtorsPal WebRTC App"
VOICE_URL = f"{BASE_URL}/api/twiml/webrtc-outbound"

def create_or_get_twiml_app():
    """Create or get existing TwiML Application"""
    try:
        client = Client(ACCOUNT_SID, AUTH_TOKEN)
        
        # Check if TwiML App already exists
        print("🔍 Checking for existing TwiML Applications...")
        apps = client.applications.list(friendly_name=TWIML_APP_NAME)
        
        if apps:
            app = apps[0]
            print(f"✅ Found existing TwiML App:")
            print(f"   Name: {app.friendly_name}")
            print(f"   SID: {app.sid}")
            print(f"   Voice URL: {app.voice_url}")
            
            # Update if voice URL changed
            if app.voice_url != VOICE_URL:
                print(f"🔄 Updating Voice URL to: {VOICE_URL}")
                app.update(voice_url=VOICE_URL, voice_method='POST')
                print("✅ Voice URL updated")
            
            return app.sid
        
        # Create new TwiML App
        print(f"📝 Creating new TwiML Application: {TWIML_APP_NAME}")
        app = client.applications.create(
            friendly_name=TWIML_APP_NAME,
            voice_url=VOICE_URL,
            voice_method='POST',
            status_callback=f"{BASE_URL}/api/twiml/status-callback",
            status_callback_method='POST'
        )
        
        print(f"✅ TwiML Application created successfully!")
        print(f"   Name: {app.friendly_name}")
        print(f"   SID: {app.sid}")
        print(f"   Voice URL: {app.voice_url}")
        print(f"\n💾 Save this SID to your .env file:")
        print(f"   TWILIO_TWIML_APP_SID={app.sid}")
        
        return app.sid
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    twiml_app_sid = create_or_get_twiml_app()
    if twiml_app_sid:
        print(f"\n🎉 TwiML App SID: {twiml_app_sid}")
        sys.exit(0)
    else:
        print("\n❌ Failed to create/get TwiML App")
        sys.exit(1)
