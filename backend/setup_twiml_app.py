"""
Twilio setup with NO hard-coded secrets.

Order of credential sources:
1) Environment variables (emergency override, never committed)
2) MongoDB `secrets` collection (encrypted at rest)

Expected env:
- MONGO_URL
- APP_ENCRYPTION_KEY  # base64 32-byte key for AES-256-GCM
- Optional emergency overrides:
  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_API_KEY, TWILIO_API_SECRET
"""

import os
import base64
import json
from typing import Optional, Dict

from pymongo import MongoClient
from twilio.rest import Client

try:
    # pycryptodome
    from Crypto.Cipher import AES
except Exception as e:  # pragma: no cover
    AES = None  # If Crypto isn't installed, DB decryption path won't be used.


def _decrypt_obj(b64_payload: str, key_b64: str) -> Dict:
    """Decrypts base64(AES-GCM(iv[12] + tag[16] + ciphertext)) -> dict"""
    if AES is None:
        raise RuntimeError("Crypto library not available; set env vars or install pycryptodome.")
    raw = base64.b64decode(b64_payload)
    iv, tag, enc = raw[:12], raw[12:28], raw[28:]
    key = base64.b64decode(key_b64)
    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    cipher.update(b"")
    data = cipher.decrypt_and_verify(enc, tag)
    return json.loads(data.decode("utf-8"))


def _get_twilio_from_db() -> Optional[Dict]:
    mongo_url = os.environ.get("MONGO_URL")
    enc_key = os.environ.get("APP_ENCRYPTION_KEY")
    if not mongo_url or not enc_key:
        return None

    client = MongoClient(mongo_url)
    db = client.get_default_database()
    doc = db["secrets"].find_one({"tenantId": "default", "provider": "twilio"})
    if not doc:
        return None

    decrypted = _decrypt_obj(doc["data"], enc_key)
    return {
        "account_sid": decrypted.get("accountSid"),
        "auth_token": decrypted.get("authToken"),
        "api_key": decrypted.get("apiKey"),
        "api_secret": decrypted.get("apiSecret"),
    }


def get_twilio_client() -> Client:
    """
    Returns a configured Twilio client.
    Prefers API Key/Secret + Account SID, falls back to Account SID + Auth Token.
    """
    # 1) Env overrides
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    api_key = os.environ.get("TWILIO_API_KEY")
    api_secret = os.environ.get("TWILIO_API_SECRET")

    # 2) If no env, pull from DB
    if not any([account_sid, auth_token, api_key, api_secret]):
        creds = _get_twilio_from_db()
        if not creds:
            raise RuntimeError("Twilio credentials not configured (env or DB).")
        account_sid = creds.get("account_sid")
        auth_token = creds.get("auth_token")
        api_key = creds.get("api_key")
        api_secret = creds.get("api_secret")

    # Prefer restricted API key/secret usage with explicit account_sid
    if api_key and api_secret and account_sid:
        return Client(api_key, api_secret, account_sid=account_sid)

    if account_sid and auth_token:
        return Client(account_sid, auth_token)

    raise RuntimeError("Incomplete Twilio credentials: need API key+secret+account_sid or account_sid+auth_token.")


# Example (server-side only):
# client = get_twilio_client()
# client.messages.create(to="+15555555555", from_="+15555550000", body="Hello from secure setup!")
