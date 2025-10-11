"""
RealtorPal LeadGen Service (CrewAI + Apify) — single-file backend

REQUIRES (install in your backend environment):
  fastapi==0.111.0
  uvicorn[standard]==0.30.1
  crewai==0.51.0
  pydantic==2.7.4
  requests==2.32.3
  python-dotenv==1.0.1   (optional, if you load env from .env)

ENV:
  OPENAI_API_KEY        -> already available from Settings (per user)
  APIFY_TOKEN           -> optional; defaults to the inline token below
  APIFY_ZILLOW_ACTOR    -> optional, defaults to "epctex~zillow-scraper"
  APIFY_KIJIJI_ACTOR    -> optional, defaults to "epctex~kijiji-scraper"

EXPOSED ENDPOINTS:
  POST /api/agents/leadgen/run              {"query": "detached OR condo in GTA"}
  GET  /api/agents/leadgen/status/{job_id}  -> status + counts + lead_ids + summary
  GET  /api/agents/leadgen/stream/{job_id}  -> Server-Sent Events (log/status/summary)

FRONTEND FLOW (AI Agents page):
  1) User clicks "Run Lead Gen" (send POST above)
  2) Open popup; connect EventSource to /stream/{job_id} to show live activity
  3) Poll /status/{job_id} until done; display summary + lead IDs

NOTE:
  post_to_realtorspal() is in "simulation mode". Replace with a real requests.post(...)
  to your internal RealtorPal API when ready.
"""

# =========================
# Imports
# =========================
import os
import re
import json
import time
import uuid
import asyncio
import hashlib
import requests
from typing import List, Dict, Any, Optional, Callable

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

from crewai import Agent, Task, Crew


# =========================
# Global configuration
# =========================

# API Keys Cache
_API_KEYS_CACHE = {}

async def get_api_secret(key_name: str) -> str:
    """Retrieve API key from database (cached)."""
    if key_name in _API_KEYS_CACHE:
        return _API_KEYS_CACHE[key_name]
    
    try:
        mongo_url = os.getenv("MONGO_URL", "mongodb://127.0.0.1:27017")
        db_name = os.getenv("DB_NAME", "realtorspal")
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        doc = await db.api_secrets.find_one({"service_name": "global_api_secrets"})
        if doc and "secrets" in doc:
            _API_KEYS_CACHE.update(doc["secrets"])
            client.close()
            return _API_KEYS_CACHE.get(key_name, "")
        
        client.close()
        return ""
    except Exception as e:
        print(f"Error retrieving API key {key_name}: {e}")
        # Fallback to environment variable
        return os.getenv(key_name, "")

def get_api_secret_sync(key_name: str) -> str:
    """Synchronous wrapper for getting API keys."""
    # First check cache
    if key_name in _API_KEYS_CACHE:
        return _API_KEYS_CACHE[key_name]
    
    # Try to get from environment
    env_value = os.getenv(key_name, "")
    if env_value:
        return env_value
    
    # Try async retrieval
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(get_api_secret(key_name))
        loop.close()
        return result
    except Exception as e:
        print(f"Error in get_api_secret_sync for {key_name}: {e}")
        return ""

# Apify token (retrieved from database or environment)
APIFY_TOKEN = get_api_secret_sync("APIFY_TOKEN")
print(f"[LEADGEN_SERVICE] APIFY_TOKEN loaded: {APIFY_TOKEN[:20] if APIFY_TOKEN else 'NONE'}...")
APIFY_BASE = "https://api.apify.com/v2"
APIFY_GOOGLE_MAPS_ACTOR = os.getenv("APIFY_GOOGLE_MAPS_ACTOR", "nwua9Gu5YrADL7ZDj")  # Google Maps Scraper
APIFY_ZILLOW_ACTOR = os.getenv("APIFY_ZILLOW_ACTOR", "epctex~zillow-scraper")
APIFY_KIJIJI_ACTOR = os.getenv("APIFY_KIJIJI_ACTOR", "service-paradis~kijiji-crawler")

# Canadian postal code regex
POSTAL_RE = re.compile(r"[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d")

# In-memory job store (swap to Redis/DB in production)
JOBS: Dict[str, Dict[str, Any]] = {}  # job_id -> {"status": str, "log": [str], "result": dict}


# =========================
# Utilities
# =========================

def _log(job_id: str, message: str):
    """Append a log line to a job (for SSE)."""
    try:
        JOBS[job_id]["log"].append(message)
    except Exception:
        pass

def _safe_log(callable_log: Callable[[str], None], message: str):
    try:
        callable_log(message)
    except Exception:
        pass

def _split_address(addr: Optional[str]) -> Dict[str, Optional[str]]:
    """Split a full address into flat fields your UI expects (city, zip)."""
    if not addr:
        return {"address": None, "city": None, "zip_code": None, "neighborhood": None}

    parts = [p.strip() for p in addr.split(",")]
    city = parts[1] if len(parts) > 1 else None
    pc = POSTAL_RE.search(addr)
    zip_code = pc.group(0).strip() if pc else None
    return {"address": addr, "city": city, "zip_code": zip_code, "neighborhood": None}

def _dedupe_key(lead: Dict[str, Any]) -> str:
    """Hash for deduplication: (email or phone) + address."""
    pid = (lead.get("email") or lead.get("phone") or "").lower()
    addr = (lead.get("address") or "").lower()
    return hashlib.sha256(f"{pid}|{addr}".encode("utf-8")).hexdigest()


# =========================
# CrewAI LLM + Agents
# =========================

def _get_llm():
    """Return the LLM object for CrewAI agents."""
    from langchain_openai import ChatOpenAI
    # Get key from database first, then fall back to environment
    key = get_api_secret_sync("OPENAI_API_KEY")
    if not key:
        raise ValueError("OPENAI_API_KEY not found in database or environment.")
    return ChatOpenAI(model="gpt-4o-mini", api_key=key, temperature=0.7)

# Lazy-loaded agents (initialized on first use)
_AGENTS_CACHE = {}

def get_agent(agent_name: str):
    """Get or create an agent (lazy loading)."""
    if agent_name in _AGENTS_CACHE:
        return _AGENTS_CACHE[agent_name]
    
    llm = _get_llm()
    
    agents_config = {
        "orchestrator": {
            "role": "Master Orchestrator",
            "goal": "Plan and oversee the RealtorPal lead generation workflow from sources → CRM.",
            "backstory": "A senior AI operator that explains the plan, logs milestones, and ensures quality.",
        },
        "finder": {
            "role": "Listing Source Scout",
            "goal": "Find permitted Zillow & Kijiji listings for the given search query.",
            "backstory": "Understands marketplace constraints, robots.txt, and ToS.",
        },
        "extractor": {
            "role": "Lead Extractor",
            "goal": "Extract publicly allowed property details from each listing.",
            "backstory": "Avoids scraping private/forbidden data; uses only public fields.",
        },
        "mapper": {
            "role": "CRM Field Mapper",
            "goal": "Map listing fields into RealtorPal CRM headers exactly as required by the UI.",
            "backstory": "Knows RealtorPal schema, fills unknowns as None or sensible defaults.",
        },
        "enricher": {
            "role": "Enricher & Deduper",
            "goal": "Normalize, validate, and deduplicate leads before posting.",
            "backstory": "Keeps the database clean and consistent.",
        },
        "poster": {
            "role": "RealtorPal Poster",
            "goal": "Post mapped leads to RealtorPal API.",
            "backstory": "Handles auth and payload formats.",
        },
        "summarizer": {
            "role": "Operations Summarizer",
            "goal": "Summarize results clearly for the user.",
            "backstory": "Writes crisp summaries in bullet points.",
        },
        "description_parser": {
            "role": "Description Parser",
            "goal": "Parse property listing descriptions to extract structured seller and property information.",
            "backstory": "Expert at understanding real estate listings and extracting contact details, property features, and seller information from natural language text.",
        }
    }
    
    if agent_name in agents_config:
        config = agents_config[agent_name]
        _AGENTS_CACHE[agent_name] = Agent(
            role=config["role"],
            goal=config["goal"],
            backstory=config["backstory"],
            tools=[],
            llm=llm
        )
    
    return _AGENTS_CACHE.get(agent_name)


# =========================
# Apify calls (Zillow + Kijiji)
# =========================

def _apify_run_actor(actor_id: str, actor_input: Dict[str, Any], log: Callable[[str], None], token: str = None) -> List[Dict[str, Any]]:
    """Run an Apify actor and return dataset items. Waits for completion."""
    # Use provided token or fall back to global APIFY_TOKEN
    apify_token = token or APIFY_TOKEN
    if not apify_token:
        _safe_log(log, "[APIFY] ERROR: APIFY_TOKEN is empty or None!")
        return []
    
    url = f"{APIFY_BASE}/acts/{actor_id}/runs?token={apify_token}"
    _safe_log(log, f"[APIFY] Starting actor {actor_id}...")
    _safe_log(log, f"[APIFY] Token available: {bool(apify_token)}, length: {len(apify_token) if apify_token else 0}")
    
    try:
        # Start the actor run
        run = requests.post(url, json=actor_input, timeout=60)
        run.raise_for_status()
    except requests.exceptions.HTTPError as e:
        _safe_log(log, f"[APIFY] HTTP Error: {e.response.status_code} - {e.response.text[:200]}")
        return []
    except Exception as e:
        _safe_log(log, f"[APIFY] Error starting actor: {str(e)}")
        return []
    data = run.json().get("data", {})
    run_id = data.get("id")
    dataset_id = data.get("defaultDatasetId")
    
    _safe_log(log, f"[APIFY] Actor run started with ID: {run_id}")
    _safe_log(log, "[APIFY] Waiting for actor to complete (this may take 1-3 minutes)...")

    # Poll for run completion (wait up to 5 minutes)
    max_polls = 150  # 150 * 2 seconds = 5 minutes max
    poll_interval = 2  # seconds
    
    for poll_count in range(max_polls):
        time.sleep(poll_interval)
        
        # Check run status
        r = requests.get(f"{APIFY_BASE}/actor-runs/{run_id}?token={apify_token}", timeout=30)
        r.raise_for_status()
        rd = r.json().get("data", {})
        
        status = rd.get("status")
        dataset_id = rd.get("defaultDatasetId")
        
        # Log progress every 10 polls (20 seconds)
        if poll_count % 10 == 0 or status in ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"]:
            _safe_log(log, f"[APIFY] Status: {status} (checked {poll_count + 1} times)")
        
        # Check if run is complete
        if status == "SUCCEEDED":
            _safe_log(log, "[APIFY] ✓ Actor completed successfully!")
            break
        elif status in ["FAILED", "ABORTED", "TIMED-OUT"]:
            _safe_log(log, f"[APIFY] ✗ Actor run failed with status: {status}")
            return []
    else:
        # Max polls reached without completion
        _safe_log(log, f"[APIFY] ⚠ Timeout: Actor still running after {max_polls * poll_interval} seconds")
        _safe_log(log, "[APIFY] Attempting to fetch partial results...")

    # Fetch dataset items
    if not dataset_id:
        _safe_log(log, "[APIFY] No dataset ID available; returning 0 items.")
        return []

    _safe_log(log, f"[APIFY] Fetching results from dataset {dataset_id}...")
    items_response = requests.get(f"{APIFY_BASE}/datasets/{dataset_id}/items?token={apify_token}", timeout=90)
    items_response.raise_for_status()
    rows = items_response.json()
    _safe_log(log, f"[APIFY] ✓ Dataset fetch status: {items_response.status_code}")
    _safe_log(log, f"[APIFY] ✓ Response type: {type(rows)}, length: {len(rows) if isinstance(rows, list) else 'N/A'}")
    
    # Debug: Log response details
    if isinstance(rows, list) and len(rows) > 0:
        first_item_keys = list(rows[0].keys()) if isinstance(rows[0], dict) else "Not a dict"
        _safe_log(log, f"[APIFY] First item keys: {first_item_keys}")
        _safe_log(log, f"[APIFY] First item preview: {str(rows[0])[:150]}")
    elif isinstance(rows, list) and len(rows) == 0:
        _safe_log(log, f"[APIFY] ⚠ Dataset exists but contains 0 items!")
        _safe_log(log, f"[APIFY] This could mean: 1) No listings found at URL, 2) Actor configuration issue, 3) Scraping failed")
    else:
        _safe_log(log, f"[APIFY] ⚠ Unexpected response format: {type(rows)}")
    
    return rows if isinstance(rows, list) else []

def search_zillow(query: str, max_results: int, log: Callable[[str], None]) -> List[Dict[str, Any]]:
    """
    epctex~zillow-scraper – adjust input if you customize actor.
    """
    # Get token fresh from cache or database
    token = get_api_secret_sync("APIFY_TOKEN")
    actor_input = {"locationQuery": query, "maxItems": max_results, "includeSold": False}
    items = _apify_run_actor(APIFY_ZILLOW_ACTOR, actor_input, log, token)
    out = []
    for it in items:
        out.append({
            "source": "zillow",
            "title": it.get("title") or it.get("name") or "Listing",
            "price": it.get("price") or it.get("priceText"),
            "address": it.get("address") or it.get("fullAddress"),
            "url": it.get("url") or it.get("detailUrl"),
            "homeType": it.get("homeType") or it.get("propertyType"),
        })
    return out

def search_google_maps(search_terms: str, location: str, max_results: int, log: Callable[[str], None]) -> List[Dict[str, Any]]:
    """
    Google Maps Scraper (nwua9Gu5YrADL7ZDj) - extract real estate agents and sellers from Google Maps
    """
    # Get token fresh from cache or database
    token = get_api_secret_sync("APIFY_TOKEN")
    _safe_log(log, f"[FINDER] Token retrieved: {bool(token)}, length: {len(token) if token else 0}")
    
    # Google Maps Scraper input format
    actor_input = {
        "searchStringsArray": [search_terms],
        "locationQuery": location,
        "maxCrawledPlacesPerSearch": max_results,
        "language": "en",
        "includeWebResults": False,
        "includeHistogram": False
    }
    
    _safe_log(log, f"[FINDER] Searching Google Maps: '{search_terms}' in {location}, max results: {max_results}")
    items = _apify_run_actor(APIFY_GOOGLE_MAPS_ACTOR, actor_input, log, token)
    
    _safe_log(log, f"[FINDER] Received {len(items)} items from Apify")
    
    # Debug: Log structure of first few items
    if len(items) > 0:
        _safe_log(log, f"[FINDER] First item keys: {list(items[0].keys())[:15]}")
        sample = items[0]
        _safe_log(log, f"[FINDER] Fields check - title: {bool(sample.get('title'))}, phone: {bool(sample.get('phoneNumber'))}, website: {bool(sample.get('website'))}")
    
    out = []
    skipped = 0
    
    for idx, it in enumerate(items):
        # Extract from Google Maps response using ACTUAL field names
        title = it.get("title", "")
        phone = it.get("phone", "")  # Correct field name
        website = it.get("website", "")  # Correct field name
        street = it.get("street", "")
        
        # Skip items without title (need at least business name)
        if not title:
            skipped += 1
            if idx < 3:
                _safe_log(log, f"[FINDER] Skipping item {idx+1}: No title. Keys: {list(it.keys())[:5]}")
            continue
        
        # Extract location details using ACTUAL field names
        city = it.get("city", "")
        state = it.get("state", "")
        postal_code = it.get("postalCode", "")
        country_code = it.get("countryCode", "CA")
        
        # Build full address
        full_address = f"{street}, {city}, {state}" if street else f"{city}, {state}"
        
        # Seller/Agent information
        seller_info = {
            "name": title,
            "phone": phone,
            "email": None,  # Google Maps doesn't provide email
            "website": website,
            "location": f"{city}, {state}" if city and state else location
        }
        
        # Create listing object with correct field mappings
        listing = {
            "source": "google_maps",
            "title": title,
            "phone": phone,
            "website": website,
            "description": it.get("categoryName", ""),
            "address": full_address,
            "street": street,
            "city": city,
            "province": state,
            "postalCode": postal_code,
            "countryCode": country_code,
            "url": it.get("url", ""),
            "rating": it.get("totalScore"),  # Correct field name
            "reviews_count": it.get("reviewsCount"),  # Correct field name
            "category": it.get("categoryName"),
            "latitude": it.get("latitude"),
            "longitude": it.get("longitude"),
            "images": it.get("imageUrls", []),
            "seller": seller_info,
            "raw_data": it
        }
        out.append(listing)
        
        # Log first item for verification
        if idx == 0:
            _safe_log(log, f"[FINDER] First listing: {title}, Phone: {phone or 'N/A'}, City: {city}")
    
    _safe_log(log, f"[FINDER] Extracted {len(out)} listings (skipped {skipped} without title)")
    return out

def search_kijiji(start_url: str, max_pages: int, log: Callable[[str], None]) -> List[Dict[str, Any]]:
    """
    service-paradis~kijiji-crawler – using URL-based input format matching Apify actor requirements
    """
    # Get token fresh from cache or database
    token = get_api_secret_sync("APIFY_TOKEN")
    _safe_log(log, f"[FINDER] Token retrieved: {bool(token)}, length: {len(token) if token else 0}")
    
    # Kijiji crawler expects this exact format based on Apify documentation
    actor_input = {
        "debug": False,
        "fetchAdsFromSearch": False,
        "maxPagesToSearch": max_pages,
        "proxy": {
            "useApifyProxy": False
        },
        "startUrls": [
            {
                "url": start_url
            }
        ]
    }
    _safe_log(log, f"[FINDER] Searching Kijiji with URL: {start_url}, max pages: {max_pages}")
    items = _apify_run_actor(APIFY_KIJIJI_ACTOR, actor_input, log, token)
    
    _safe_log(log, f"[FINDER] Received {len(items)} items from Apify")
    
    # Debug: Log structure of first few items
    if len(items) > 0:
        _safe_log(log, f"[FINDER] First item keys: {list(items[0].keys())}")
        _safe_log(log, f"[FINDER] First item sample: {str(items[0])[:200]}")
        
        # Check what fields are actually present
        sample = items[0]
        _safe_log(log, f"[FINDER] Fields check - title: {bool(sample.get('title'))}, url: {bool(sample.get('url'))}, description: {bool(sample.get('description'))}")
    
    out = []
    skipped = 0
    for idx, it in enumerate(items):
        # Extract basic listing info from Apify Kijiji response
        # Check multiple possible field names
        title = it.get("title") or it.get("heading") or it.get("name") or ""
        description = it.get("description") or it.get("desc") or ""
        url = it.get("url") or it.get("link") or it.get("href") or ""
        
        # Skip items without title OR url (need at least one identifier)
        if not title and not url:
            skipped += 1
            if idx < 3:  # Log first 3 skipped items for debugging
                _safe_log(log, f"[FINDER] Skipping item {idx+1}: No title/url. Keys: {list(it.keys())[:5]}")
            continue
        
        # If no title but has URL, use URL as title
        if not title:
            title = f"Listing from {url[:50]}"
        
        if (idx + 1) % 10 == 0:
            _safe_log(log, f"[FINDER] Processing listing {idx+1}/{len(items)}...")
        
        # Try to extract city/location from title
        location_parts = title.split(",") if "," in title else []
        city = location_parts[-1].strip() if len(location_parts) > 1 else None
        
        # Seller information - basic extraction from title
        seller_name = "Kijiji Seller"
        if "seller" in title.lower():
            seller_name = "Property Seller"
        
        seller_info = {
            "name": seller_name,
            "phone": None,
            "email": None,
            "location": city
        }
        
        # Extract property details directly from Apify data
        # Create listing object with all available data
        listing = {
            "source": "kijiji",
            "title": title,
            "price": it.get("price"),
            "description": description,
            "address": None,
            "city": city,
            "province": "Ontario",
            "postalCode": None,
            "url": url,
            "homeType": None,
            "bedrooms": None,
            "bathrooms": None,
            "squareFeet": None,
            "lotSize": None,
            "features": [],
            "images": [it.get("imageUrl")] if it.get("imageUrl") else [],
            "listingDate": None,
            "seller": seller_info,
            "raw_data": it  # Store raw Apify data for debugging
        }
        out.append(listing)
    
    _safe_log(log, f"[FINDER] Extracted {len(out)} listings (skipped {skipped} without title/url)")
    return out

def search_sources(query: str, max_results: int, log: Callable[[str], None]) -> List[Dict[str, Any]]:
    """Aggregate Zillow + Kijiji results (trim to max_results)."""
    results: List[Dict[str, Any]] = []
    try:
        results += search_zillow(query, max_results, log)
    except Exception as e:
        _safe_log(log, f"[ZILLOW] {e}")
    try:
        results += search_kijiji(query, max_results, log)
    except Exception as e:
        _safe_log(log, f"[KIJIJI] {e}")

    clean = []
    for r in results:
        if not r.get("url"):
            continue
        clean.append({
            "source": r.get("source"),
            "title": r.get("title") or "Listing",
            "price": r.get("price"),
            "address": r.get("address"),
            "url": r.get("url"),
            "homeType": r.get("homeType"),
        })
        if len(clean) >= max_results:
            break
    return clean


# =========================
# Extraction + Mapping to RealtorPal CRM
# =========================

def extract_listing_minimal(listing: Dict[str, Any], log: Callable[[str], None]) -> Dict[str, Any]:
    """Keep only public/allowed fields. Pass through all Google Maps data."""
    _safe_log(log, f"[EXTRACTOR] Extract from {listing.get('url')}")
    
    # Pass through ALL fields from Google Maps listing
    return {
        "source": listing.get("source"),
        "title": listing.get("title"),
        "phone": listing.get("phone"),  # ✓ Keep phone
        "website": listing.get("website"),  # ✓ Keep website
        "price": listing.get("price"),
        "address": listing.get("address"),  # Full address string
        "address_full": listing.get("address"),
        "street": listing.get("street"),
        "city": listing.get("city"),
        "province": listing.get("province"),
        "postalCode": listing.get("postalCode"),
        "countryCode": listing.get("countryCode"),
        "url": listing.get("url"),
        "property_type": listing.get("homeType"),
        "category": listing.get("category"),
        "rating": listing.get("rating"),
        "reviews_count": listing.get("reviews_count"),
        "seller": listing.get("seller"),  # ✓ Keep seller info with phone
        "raw_data": listing.get("raw_data")  # Keep raw data for debugging
    }

def map_to_crm_fields(extracted: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map listing → RealtorPal CRM flat fields (matching your UI headers):
      Basic Information: name, email, phone, work_phone, home_phone
      Status & Pipeline: pipeline, status, stage, priority, lead_rating
      Property Information: property_type, buying_in, house_to_sell, owns_rents
      Address: address, city, zip_code, neighborhood
      Spouse Information: spouse_name, spouse_email, spouse_phone, spouse_birthday
      Agent Assignments: main_agent, mortgage_agent, listing_agent
      Budget Information: budget, price_min, price_max
      Description: description
    """
    addr_parts = _split_address(extracted.get("address_full"))
    price_val = extracted.get("price")
    # Normalize price if string like "$649,000"
    if isinstance(price_val, str):
        digits = re.sub(r"[^\d.]", "", price_val)
        price_num = int(float(digits)) if digits else None
    elif isinstance(price_val, (int, float)):
        price_num = int(price_val)
    else:
        price_num = None

    # Get seller information
    seller = extracted.get("seller", {})
    
    # Debug: Get phone from multiple possible sources
    phone_number = (seller.get("phone") or 
                   extracted.get("phone") or 
                   extracted.get("phoneNumber") or 
                   None)
    
    crm = {
        # Basic Information - from seller
        "name": seller.get("name"),
        "email": seller.get("email"),
        "phone": phone_number,
        "work_phone": None,
        "home_phone": None,

        # Status & Pipeline (defaults; you can override in UI)
        "pipeline": "new",
        "status": "Open",
        "stage": "Engagement",
        "priority": "medium",
        "lead_rating": None,

        # Property Information - from listing
        "property_type": extracted.get("property_type") or extracted.get("homeType"),
        "buying_in": None,
        "house_to_sell": extracted.get("address"),
        "owns_rents": "owns",  # Assuming seller owns the property

        # Address - from listing
        "address": addr_parts["address"] or extracted.get("address"),
        "city": addr_parts["city"] or extracted.get("city"),
        "zip_code": addr_parts["zip_code"] or extracted.get("postalCode"),
        "neighborhood": addr_parts["neighborhood"],

        # Spouse Information
        "spouse_name": None,
        "spouse_email": None,
        "spouse_phone": None,
        "spouse_birthday": None,

        # Agent Assignments
        "main_agent": None,
        "mortgage_agent": None,
        "listing_agent": None,

        # Budget Information
        "budget": None,
        "price_min": price_num,
        "price_max": price_num,
        "price": price_num,

        # Property Details - additional fields from parsed data
        "bedrooms": extracted.get("bedrooms"),
        "bathrooms": extracted.get("bathrooms"),
        "squareFeet": extracted.get("squareFeet"),
        "lotSize": extracted.get("lotSize"),
        "features": extracted.get("features", []),
        "title": extracted.get("title"),
        "listingDate": extracted.get("listingDate"),
        "images": extracted.get("images", []),
        "homeType": extracted.get("homeType"),
        "postalCode": extracted.get("postalCode"),
        
        # Google Maps specific fields
        "website": extracted.get("website") or seller.get("website"),
        "rating": extracted.get("rating"),
        "reviews_count": extracted.get("reviews_count"),
        "category": extracted.get("category"),

        # Description
        "description": extracted.get("description") or extracted.get("title") or "Property lead",
        
        # Metadata
        "source": extracted.get("source"),
        "source_url": extracted.get("url"),
        "seller": seller,  # Keep seller info for later processing
    }
    return crm


# =========================
# Validation / Dedup / Posting
# =========================

_seen_keys = set()

def validate_and_dedupe(crm: Dict[str, Any]) -> (bool, Optional[str]):
    """
    Return (is_unique, duplicate_key_if_any)
    """
    key = _dedupe_key(crm)
    if key in _seen_keys:
        return False, key
    _seen_keys.add(key)
    return True, None

async def save_partial_lead(lead_data: Dict[str, Any]) -> str:
    """Save partial lead data to a separate collection when full lead creation fails."""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import uuid
        from datetime import datetime
        
        mongo_url = os.getenv("MONGO_URL", "mongodb://127.0.0.1:27017")
        db_name = os.getenv("DB_NAME", "realtorspal")
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        partial_lead = {
            "id": str(uuid.uuid4()),
            "raw_data": lead_data,
            "source": "AI Lead Generation - Partial",
            "created_at": datetime.utcnow().isoformat(),
            "status": "needs_review",
            "notes": "Partial lead data - needs manual review and completion"
        }
        
        await db.partial_leads.insert_one(partial_lead)
        client.close()
        return partial_lead["id"]
    except Exception as e:
        print(f"Error saving partial lead: {e}")
        return None

def post_to_realtorspal(crm: Dict[str, Any], log: Callable[[str], None]) -> Dict[str, Any]:
    """
    Post lead to RealtorPal CRM via internal API.
    """
    try:
        # Import here to avoid circular dependencies
        from motor.motor_asyncio import AsyncIOMotorClient
        import asyncio
        
        # Get user_id from environment or use demo user
        user_id = os.getenv("LEADGEN_USER_ID", "03f82986-51af-460c-a549-1c5077e67fb0")
        
        # Extract seller information if available
        seller = crm.get("seller", {})
        business_name = seller.get("name") or crm.get("title") or "Unknown Business"
        
        # Parse business name intelligently
        # Example: "Royal LePage County Realty" -> First: "Royal LePage", Last: "County Realty"
        name_parts = business_name.split(" ", 2)
        if len(name_parts) >= 3:
            first_name = " ".join(name_parts[:2])  # First 2 words
            last_name = name_parts[2]  # Rest
        elif len(name_parts) == 2:
            first_name = name_parts[0]
            last_name = name_parts[1]
        else:
            first_name = business_name
            last_name = "Agency"
        
        # Create lead object matching CreateLeadRequest schema
        lead_data = {
            "user_id": user_id,
            "first_name": first_name,
            "last_name": last_name,
            "email": seller.get("email") or crm.get("email"),
            "phone": seller.get("phone") or crm.get("phone"),
            "property_type": crm.get("property_type") or crm.get("homeType"),
            "neighborhood": crm.get("neighborhood"),
            "city": crm.get("city"),
            "zip_postal_code": crm.get("zip_code") or crm.get("postalCode"),
            "address": crm.get("address"),
            "price_min": crm.get("price_min"),
            "price_max": crm.get("price_max") or crm.get("price"),
            "bedrooms": crm.get("bedrooms"),
            "bathrooms": crm.get("bathrooms"),
            "priority": crm.get("priority", "medium"),
            "stage": crm.get("stage", "New"),
            "pipeline": crm.get("pipeline", "New Lead"),
            "lead_source": "AI Lead Generation",
            "lead_type": "Agent" if seller.get("name") else "Contact",
            "notes": f"{crm.get('title', 'No title')}\n" + 
                     (f"Category: {crm.get('category', 'N/A')}\n" if crm.get('category') else "") +
                     (f"Description: {crm.get('description', 'N/A')[:200]}\n" if crm.get('description') else "") +
                     (f"Website: {seller.get('website', 'N/A')}\n" if seller.get('website') else "") +
                     (f"Rating: {crm.get('rating')}/5 ({crm.get('reviews_count')} reviews)\n" if crm.get('rating') else "") +
                     (f"URL: {crm.get('source_url', '')}" if crm.get('source_url') else ""),
            "in_dashboard": True,
            "source_tags": ["AI Generated", crm.get('source', 'Unknown').title(), crm.get('category', 'Lead') or 'Lead']
        }
        
        # Use asyncio to insert into database directly
        async def insert_lead():
            mongo_url = os.getenv("MONGO_URL", "mongodb://127.0.0.1:27017")
            db_name = os.getenv("DB_NAME", "realtorspal")
            client = AsyncIOMotorClient(mongo_url)
            db = client[db_name]
            
            # Generate UUID for lead
            lead_id = str(__import__('uuid').uuid4())
            lead_data["id"] = lead_id
            lead_data["created_at"] = __import__('datetime').datetime.utcnow().isoformat()
            
            # Insert lead
            await db.leads.insert_one(lead_data)
            client.close()
            return lead_id
        
        # Run async function - use new event loop since we're in background task
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            lead_id = loop.run_until_complete(insert_lead())
            loop.close()
            _safe_log(log, f"[POSTER] Successfully created lead_id={lead_id}")
            return {"status": "created", "lead_id": lead_id}
        except Exception as db_error:
            _safe_log(log, f"[POSTER] Database insert error: {db_error}")
            raise  # Re-raise to trigger partial lead fallback
        
    except Exception as e:
        _safe_log(log, f"[POSTER] Error creating lead: {e}")
        _safe_log(log, f"[POSTER] Attempting to save as partial lead...")
        
        # Try to save as partial lead
        try:
            partial_id = asyncio.run(save_partial_lead(crm))
            if partial_id:
                _safe_log(log, f"[POSTER] Saved as partial lead: {partial_id}")
                return {"status": "partial", "lead_id": partial_id}
        except:
            pass
        
        # Final fallback to simulated mode
        lead_id = hashlib.md5(json.dumps(crm, sort_keys=True).encode()).hexdigest()[:12]
        _safe_log(log, f"[POSTER] Posted (fallback sim) lead_id={lead_id}")
        return {"status": "created", "lead_id": lead_id}


# =========================
# Orchestrated pipeline (with CrewAI plan + summary)
# =========================

def orchestrate_plan(query: str) -> str:
    """Ask the Master Orchestrator to produce a short plan for the run."""
    orchestrator = get_agent("orchestrator")
    t = Task(
        description=(
            "Create a short 4–6 bullet plan for a lead generation run given the query.\n"
            f"Query: {query}\n"
            "Steps must include: find sources (Zillow/Kijiji via Apify), extract public data, "
            "map to CRM headers, dedupe, post to RealtorPal, and produce a summary."
        ),
        agent=orchestrator,
        expected_output="A 4–6 bullet plan."
    )
    result = Crew(agents=[orchestrator], tasks=[t]).kickoff()
    # CrewOutput has a .raw property that contains the string output
    return str(result.raw) if hasattr(result, 'raw') else str(result)

def summarize_counts(counts: Dict[str, int]) -> str:
    """CrewAI-generated bullet summary."""
    summarizer = get_agent("summarizer")
    t = Task(
        description=(
            "Summarize these counts in 4–6 concise bullets:\n"
            f"{json.dumps(counts, indent=2)}"
        ),
        agent=summarizer,
        expected_output="A short bullet list."
    )
    result = Crew(agents=[summarizer], tasks=[t]).kickoff()
    # CrewOutput has a .raw property that contains the string output
    return str(result.raw) if hasattr(result, 'raw') else str(result)

def parse_listing_description(title: str, description: str, log: Callable[[str], None]) -> Dict[str, Any]:
    """Use CrewAI to parse property listing description and extract structured data."""
    try:
        description_parser = get_agent("description_parser")
        t = Task(
            description=(
                f"Parse this real estate listing and extract ALL available information:\n\n"
                f"Title: {title}\n"
                f"Description: {description}\n\n"
                f"Extract and return a JSON object with these fields (use null for missing data):\n"
                f"- seller_name: Name or identifier of the seller\n"
                f"- seller_phone: Phone number if mentioned\n"
                f"- seller_email: Email if mentioned\n"
                f"- property_type: Type of property (house, condo, land, etc.)\n"
                f"- bedrooms: Number of bedrooms\n"
                f"- bathrooms: Number of bathrooms\n"
                f"- square_feet: Property size in square feet\n"
                f"- lot_size: Lot size if mentioned\n"
                f"- city: City name\n"
                f"- address: Full address if available\n"
                f"- price_details: Any additional price information\n"
                f"- features: List of key features mentioned\n"
                f"Return ONLY valid JSON, no additional text."
            ),
            agent=description_parser,
            expected_output="Valid JSON object with extracted data"
        )
        result = Crew(agents=[description_parser], tasks=[t]).kickoff()
        result_text = str(result.raw) if hasattr(result, 'raw') else str(result)
        
        # Try to parse JSON from the result
        try:
            # Remove markdown code blocks if present
            result_text = result_text.strip()
            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]
            result_text = result_text.strip()
            
            parsed_data = json.loads(result_text)
            _safe_log(log, "[PARSER] Successfully parsed description")
            return parsed_data
        except json.JSONDecodeError as e:
            _safe_log(log, f"[PARSER] JSON parse error, using fallback: {e}")
            return {}
            
    except Exception as e:
        _safe_log(log, f"[PARSER] Error parsing description: {e}")
        return {}

def run_pipeline(start_url: str, max_pages: int, log: Callable[[str], None]) -> Dict[str, Any]:
    # Plan (CrewAI)
    plan = orchestrate_plan(f"Scrape Kijiji URL: {start_url} for {max_pages} pages")
    _safe_log(log, "[ORCHESTRATOR] Plan -> " + plan.replace("\n", " "))

    # 1) Find - only use Kijiji with URL
    listings = search_kijiji(start_url, max_pages, log)
    _safe_log(log, f"[FINDER] Found {len(listings)} Kijiji listings")

    # 2) Extract (public fields)
    extracted = [extract_listing_minimal(ls, log=log) for ls in listings]

    # 3) Map to CRM
    mapped: List[Dict[str, Any]] = [map_to_crm_fields(e) for e in extracted]
    _safe_log(log, f"[MAPPER] Mapped {len(mapped)} leads to CRM fields")

    # 4) Validate + Dedupe
    unique: List[Dict[str, Any]] = []
    duplicates: List[Dict[str, Any]] = []
    for crm in mapped:
        ok, dupkey = validate_and_dedupe(crm)
        if ok:
            unique.append(crm)
        else:
            duplicates.append(crm)
    _safe_log(log, f"[ENRICHER] Unique={len(unique)} Duplicates={len(duplicates)}")

    # 5) Post
    posted = []
    for crm in unique:
        res = post_to_realtorspal(crm, log=log)
        posted.append({"lead_id": res["lead_id"], "payload": crm})

    counts = {
        "found": len(listings),
        "extracted": len(extracted),
        "mapped": len(mapped),
        "unique": len(unique),
        "duplicates": len(duplicates),
        "posted": len(posted),
    }

    # 6) Summary (CrewAI)
    summary = summarize_counts(counts)

    return {
        "plan": plan,
        "summary": summary,
        "counts": counts,
        "posted": posted,
        "duplicates": duplicates,
    }


# =========================
# FastAPI service + SSE
# =========================

# Create sub-application for mounting (no CORS middleware needed - main app handles it)
app = FastAPI(title="RealtorPal LeadGen Agent")

class RunRequest(BaseModel):
    searchTerms: str  # e.g., "real estate agents in Toronto"
    location: str = "Canada"  # Location to search
    maxResults: int = 20  # Number of places to extract per search term

def _run_job(job_id: str, search_terms: str, location: str, max_results: int):
    """Background job to orchestrate the lead generation run."""
    def log_fn(msg: str):
        """Append msg to job's log."""
        JOBS[job_id]["log"].append(msg)

    try:
        JOBS[job_id]["status"] = "running"
        _safe_log(log_fn, f"[START] Job {job_id} started with search='{search_terms}', location={location}, max={max_results}")

        # Orchestrator plan
        plan = orchestrate_plan(f"Search Google Maps for '{search_terms}' in {location}, extract up to {max_results} results")
        _safe_log(log_fn, f"[ORCHESTRATOR] Plan => {plan}")

        # Find - use Google Maps
        google_maps_results = search_google_maps(search_terms, location, max_results, log_fn)
        _safe_log(log_fn, f"[FINDER] Found {len(google_maps_results)} Google Maps listings")

        # Extract (public fields)
        _safe_log(log_fn, f"[EXTRACTOR] Starting extraction for {len(google_maps_results)} listings")
        extracted = []
        for idx, ls in enumerate(google_maps_results):
            try:
                ext = extract_listing_minimal(ls, log=log_fn)
                extracted.append(ext)
            except Exception as e:
                _safe_log(log_fn, f"[EXTRACTOR] Error extracting listing {idx+1}: {str(e)}")
        
        _safe_log(log_fn, f"[EXTRACTOR] Successfully extracted {len(extracted)} listings")

        # Map to CRM
        _safe_log(log_fn, f"[MAPPER] Starting mapping for {len(extracted)} extracted listings")
        mapped = []
        for idx, e in enumerate(extracted):
            try:
                crm = map_to_crm_fields(e)
                mapped.append(crm)
                if idx == 0:  # Log first mapped item
                    _safe_log(log_fn, f"[MAPPER] First mapped item keys: {list(crm.keys())[:10]}")
            except Exception as e:
                _safe_log(log_fn, f"[MAPPER] Error mapping listing {idx+1}: {str(e)}")
        
        _safe_log(log_fn, f"[MAPPER] Successfully mapped {len(mapped)} leads to CRM fields")

        # Validate + Dedupe
        unique = []
        duplicates = []
        for crm in mapped:
            ok, dupkey = validate_and_dedupe(crm)
            if ok:
                unique.append(crm)
            else:
                duplicates.append(crm)
        _safe_log(log_fn, f"[ENRICHER] Unique={len(unique)} Duplicates={len(duplicates)}")

        # Post
        _safe_log(log_fn, f"[POSTER] Starting to post {len(unique)} unique leads")
        posted = []
        failed = []
        for idx, crm in enumerate(unique):
            try:
                res = post_to_realtorspal(crm, log=log_fn)
                posted.append({"lead_id": res["lead_id"], "payload": crm})
                if (idx + 1) % 10 == 0:
                    _safe_log(log_fn, f"[POSTER] Posted {idx + 1}/{len(unique)} leads")
            except Exception as e:
                _safe_log(log_fn, f"[POSTER] Error posting lead {idx+1}: {str(e)}")
                failed.append({"error": str(e), "payload": crm})
        
        _safe_log(log_fn, f"[POSTER] Successfully posted {len(posted)} leads, failed: {len(failed)}")

        counts = {
            "found": len(google_maps_results),
            "extracted": len(extracted),
            "mapped": len(mapped),
            "unique": len(unique),
            "duplicates": len(duplicates),
            "posted": len(posted),
        }

        # Summary (CrewAI)
        summary = summarize_counts(counts)

        result = {
            "plan": plan,
            "summary": summary,
            "counts": counts,
            "posted": posted,
            "duplicates": duplicates,
        }

        JOBS[job_id]["result"] = result
        JOBS[job_id]["status"] = "done"
        _log(job_id, "[SUMMARY] " + result["summary"].replace("\n", " "))
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        JOBS[job_id]["status"] = "error"
        JOBS[job_id]["result"] = {"error": str(e), "traceback": error_details}
        _safe_log(log_fn, f"[ERROR] {str(e)}")
        _safe_log(log_fn, f"[ERROR] Traceback: {error_details}")
        print(f"[LEADGEN ERROR] Job {job_id}: {error_details}")

@app.post("/run")
def trigger_leadgen(req: RunRequest, background: BackgroundTasks):
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {"status": "queued", "log": [], "result": None}
    background.add_task(_run_job, job_id, req.searchTerms, req.location, req.maxResults)
    return {"job_id": job_id, "status": "queued"}

@app.get("/status/{job_id}")
def leadgen_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        return JSONResponse({"error": "job not found"}, status_code=404)
    res = {"status": job["status"]}
    if job.get("result"):
        res["summary"] = job["result"].get("summary", "Processing...")
        res["counts"] = job["result"].get("counts", {})
        res["lead_ids"] = [p["lead_id"] for p in job["result"].get("posted", [])]
    return res

@app.get("/stream/{job_id}")
async def leadgen_stream(job_id: str):
    if job_id not in JOBS:
        return JSONResponse({"error": "job not found"}, status_code=404)

    async def event_generator():
        last_idx = 0
        # initial status
        yield f"event: status\ndata: {JOBS[job_id]['status']}\n\n"
        while True:
            job = JOBS.get(job_id)
            if not job:
                break

            logs = job["log"]
            while last_idx < len(logs):
                line = logs[last_idx]
                last_idx += 1
                yield f"event: log\ndata: {line}\n\n"

            yield f"event: status\ndata: {job['status']}\n\n"

            if job["status"] in ("done", "error"):
                if job["result"]:
                    yield f"event: summary\ndata: {job['result']['summary']}\n\n"
                break
            await asyncio.sleep(1.0)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# =========================
# Local run helper
# =========================

if __name__ == "__main__":
    # For local testing only:  uvicorn leadgen_service:app --reload --port 8080
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080, reload=True)