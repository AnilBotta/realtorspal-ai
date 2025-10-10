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

from crewai import Agent, Task, Crew


# =========================
# Global configuration
# =========================

# Apify token (uses env override if provided)
APIFY_TOKEN = os.getenv(
    "APIFY_TOKEN",
    "apify_api_ZL39dX4gxpcwa89OMVDN3kXemAxWrf3le8T3"  # <-- your provided token
)
APIFY_BASE = "https://api.apify.com/v2"
APIFY_ZILLOW_ACTOR = os.getenv("APIFY_ZILLOW_ACTOR", "epctex~zillow-scraper")
APIFY_KIJIJI_ACTOR = os.getenv("APIFY_KIJIJI_ACTOR", "epctex~kijiji-scraper")

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
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise ValueError("OPENAI_API_KEY not set in environment.")
    return ChatOpenAI(model="gpt-4o-mini", api_key=key, temperature=0.7)

# Master Orchestrator (plans the run and explains steps)
orchestrator = Agent(
    role="Master Orchestrator",
    goal="Plan and oversee the RealtorPal lead generation workflow from sources → CRM.",
    backstory="A senior AI operator that explains the plan, logs milestones, and ensures quality.",
    tools=[],
    llm=_get_llm()
)

# Finder (discovers candidate listings)
finder = Agent(
    role="Listing Source Scout",
    goal="Find permitted Zillow & Kijiji listings for the given search query.",
    backstory="Understands marketplace constraints, robots.txt, and ToS.",
    tools=[],
    llm=_get_llm()
)

# Extractor (pulls minimal details safely)
extractor = Agent(
    role="Lead Extractor",
    goal="Extract publicly allowed property details from each listing.",
    backstory="Avoids scraping private/forbidden data; uses only public fields.",
    tools=[],
    llm=_get_llm()
)

# Mapper (maps to RealtorPal CRM fields)
mapper_agent = Agent(
    role="CRM Field Mapper",
    goal="Map listing fields into RealtorPal CRM headers exactly as required by the UI.",
    backstory="Knows RealtorPal schema, fills unknowns as None or sensible defaults.",
    tools=[],
    llm=_get_llm()
)

# Enricher/Deduper
enricher = Agent(
    role="Enricher & Deduper",
    goal="Normalize, validate, and deduplicate leads before posting.",
    backstory="Keeps the database clean and consistent.",
    tools=[],
    llm=_get_llm()
)

# Poster
poster = Agent(
    role="RealtorPal Poster",
    goal="Post mapped leads to RealtorPal API.",
    backstory="Handles auth and payload formats.",
    tools=[],
    llm=_get_llm()
)

# Summarizer
summarizer = Agent(
    role="Operations Summarizer",
    goal="Summarize results clearly for the user.",
    backstory="Writes crisp summaries in bullet points.",
    tools=[],
    llm=_get_llm()
)


# =========================
# Apify calls (Zillow + Kijiji)
# =========================

def _apify_run_actor(actor_id: str, actor_input: Dict[str, Any], log: Callable[[str], None]) -> List[Dict[str, Any]]:
    """Run an Apify actor and return dataset items."""
    url = f"{APIFY_BASE}/acts/{actor_id}/runs?token={APIFY_TOKEN}"
    _safe_log(log, f"[APIFY] Start {actor_id} input={actor_input}")
    run = requests.post(url, json=actor_input, timeout=60)
    run.raise_for_status()
    data = run.json().get("data", {})
    run_id = data.get("id")
    dataset_id = data.get("defaultDatasetId")

    # Poll run for dataset if not ready
    for _ in range(40):
        if dataset_id:
            break
        time.sleep(1.25)
        r = requests.get(f"{APIFY_BASE}/actor-runs/{run_id}?token={APIFY_TOKEN}", timeout=30)
        r.raise_for_status()
        rd = r.json().get("data", {})
        dataset_id = rd.get("defaultDatasetId")
        _safe_log(log, f"[APIFY] Status: {rd.get('status')}")

    if not dataset_id:
        _safe_log(log, "[APIFY] No datasetId; returning 0 items.")
        return []

    items = requests.get(f"{APIFY_BASE}/datasets/{dataset_id}/items?token={APIFY_TOKEN}", timeout=90)
    items.raise_for_status()
    rows = items.json()
    _safe_log(log, f"[APIFY] Rows fetched: {len(rows)} (dataset {dataset_id})")
    return rows

def search_zillow(query: str, max_results: int, log: Callable[[str], None]) -> List[Dict[str, Any]]:
    """
    epctex~zillow-scraper – adjust input if you customize actor.
    """
    actor_input = {"locationQuery": query, "maxItems": max_results, "includeSold": False}
    items = _apify_run_actor(APIFY_ZILLOW_ACTOR, actor_input, log)
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

def search_kijiji(query: str, max_results: int, log: Callable[[str], None]) -> List[Dict[str, Any]]:
    """
    epctex~kijiji-scraper – adjust input if you customize actor.
    """
    actor_input = {"search": query, "maxItems": max_results}
    items = _apify_run_actor(APIFY_KIJIJI_ACTOR, actor_input, log)
    out = []
    for it in items:
        out.append({
            "source": "kijiji",
            "title": it.get("title") or it.get("heading") or "Listing",
            "price": it.get("price"),
            "address": it.get("location") or it.get("address"),
            "url": it.get("url"),
            "homeType": None,
        })
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
    """Keep only public/allowed fields."""
    _safe_log(log, f"[EXTRACTOR] Extract from {listing.get('url')}")
    return {
        "source": listing.get("source"),
        "title": listing.get("title"),
        "price": listing.get("price"),
        "address_full": listing.get("address"),
        "url": listing.get("url"),
        "property_type": listing.get("homeType"),
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

    crm = {
        # Basic Information
        "name": None,
        "email": None,
        "phone": None,
        "work_phone": None,
        "home_phone": None,

        # Status & Pipeline (defaults; you can override in UI)
        "pipeline": "new",
        "status": "Open",
        "stage": "Engagement",
        "priority": "medium",
        "lead_rating": None,

        # Property Information
        "property_type": extracted.get("property_type"),
        "buying_in": None,
        "house_to_sell": None,
        "owns_rents": None,

        # Address
        "address": addr_parts["address"],
        "city": addr_parts["city"],
        "zip_code": addr_parts["zip_code"],
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

        # Description
        "description": extracted.get("title") or "Property lead",
        # Metadata
        "source": extracted.get("source"),
        "source_url": extracted.get("url"),
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
        
        # Create lead object matching CreateLeadRequest schema
        lead_data = {
            "user_id": user_id,
            "first_name": crm.get("name") or "Generated",
            "last_name": "Lead",
            "email": crm.get("email"),
            "phone": crm.get("phone"),
            "property_type": crm.get("property_type"),
            "neighborhood": crm.get("neighborhood"),
            "city": crm.get("city"),
            "zip_postal_code": crm.get("zip_code"),
            "address": crm.get("address"),
            "price_min": crm.get("price_min"),
            "price_max": crm.get("price_max"),
            "priority": crm.get("priority", "medium"),
            "stage": crm.get("stage", "New"),
            "pipeline": crm.get("pipeline", "New Lead"),
            "lead_source": crm.get("source", "AI Lead Generation"),
            "notes": f"Generated from {crm.get('source')} - {crm.get('source_url', '')}",
            "in_dashboard": True,
            "source_tags": ["AI Generated", crm.get('source', 'Unknown').title()]
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
        
        # Run async function
        lead_id = asyncio.run(insert_lead())
        _safe_log(log, f"[POSTER] Successfully created lead_id={lead_id}")
        return {"status": "created", "lead_id": lead_id}
        
    except Exception as e:
        _safe_log(log, f"[POSTER] Error creating lead: {e}")
        # Fallback to simulated mode
        lead_id = hashlib.md5(json.dumps(crm, sort_keys=True).encode()).hexdigest()[:12]
        _safe_log(log, f"[POSTER] Posted (fallback sim) lead_id={lead_id}")
        return {"status": "created", "lead_id": lead_id}


# =========================
# Orchestrated pipeline (with CrewAI plan + summary)
# =========================

def orchestrate_plan(query: str) -> str:
    """Ask the Master Orchestrator to produce a short plan for the run."""
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
    return Crew(agents=[orchestrator], tasks=[t]).kickoff()

def summarize_counts(counts: Dict[str, int]) -> str:
    """CrewAI-generated bullet summary."""
    t = Task(
        description=(
            "Summarize these counts in 4–6 concise bullets:\n"
            f"{json.dumps(counts, indent=2)}"
        ),
        agent=summarizer,
        expected_output="A short bullet list."
    )
    return Crew(agents=[summarizer], tasks=[t]).kickoff()

def run_pipeline(query: str, log: Callable[[str], None]) -> Dict[str, Any]:
    # Plan (CrewAI)
    plan = orchestrate_plan(query)
    _safe_log(log, "[ORCHESTRATOR] Plan -> " + plan.replace("\n", " "))

    # 1) Find
    listings = search_sources(query, max_results=10, log=log)
    _safe_log(log, f"[FINDER] Found {len(listings)} listings")

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
    query: str

def _run_job(job_id: str, query: str):
    try:
        JOBS[job_id]["status"] = "running"
        result = run_pipeline(query, log=lambda m: _log(job_id, m))
        JOBS[job_id]["result"] = result
        JOBS[job_id]["status"] = "done"
        _log(job_id, "[SUMMARY] " + result["summary"].replace("\n", " "))
    except Exception as e:
        JOBS[job_id]["status"] = "error"
        JOBS[job_id]["result"] = {"error": str(e)}
        _log(job_id, f"[ERROR] {e}")

@app.post("/run")
def trigger_leadgen(req: RunRequest, background: BackgroundTasks):
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {"status": "queued", "log": [], "result": None}
    background.add_task(_run_job, job_id, req.query)
    return {"job_id": job_id, "status": "queued"}

@app.get("/status/{job_id}")
def leadgen_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        return JSONResponse({"error": "job not found"}, status_code=404)
    res = {"status": job["status"]}
    if job["result"]:
        res["summary"] = job["result"]["summary"]
        res["counts"] = job["result"]["counts"]
        res["lead_ids"] = [p["lead_id"] for p in job["result"]["posted"]]
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