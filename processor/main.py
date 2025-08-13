from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import json
import os
import time
from typing import Dict, Any, Optional
from pydantic import BaseModel
import logging
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Mini SOC Processor", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SPLUNK_HOST = os.getenv("SPLUNK_HOST", "splunk")
SPLUNK_PORT = os.getenv("SPLUNK_PORT", "8088")
SPLUNK_TOKEN = os.getenv("SPLUNK_TOKEN", "00000000-0000-0000-0000-000000000000")
SPLUNK_INDEX = os.getenv("SPLUNK_INDEX", "main")
SPLUNK_PASSWORD = os.getenv("SPLUNK_PASSWORD", "admin")  # For REST fallback
SPLUNK_SCHEME = os.getenv("SPLUNK_SCHEME", "https")  # http or https
SPLUNK_VERIFY_SSL = os.getenv("SPLUNK_VERIFY_SSL", "false").lower() in ("1", "true", "yes")

class ZeekEvent(BaseModel):
    """Zeek event data model"""
    ts: Optional[float | str] = None
    uid: Optional[str] = None
    id_orig_h: Optional[str] = None
    id_orig_p: Optional[int] = None
    id_resp_h: Optional[str] = None
    id_resp_p: Optional[int] = None
    proto: Optional[str] = None
    service: Optional[str] = None
    duration: Optional[float] = None
    orig_bytes: Optional[int] = None
    resp_bytes: Optional[int] = None
    conn_state: Optional[str] = None
    local_orig: Optional[bool] = None
    local_resp: Optional[bool] = None
    missed_bytes: Optional[int] = None
    history: Optional[str] = None
    orig_pkts: Optional[int] = None
    orig_ip_bytes: Optional[int] = None
    resp_pkts: Optional[int] = None
    resp_ip_bytes: Optional[int] = None
    tunnel_parents: Optional[str] = None

class EnrichedEvent(BaseModel):
    """Enriched event with GeoIP data"""
    event: Dict[str, Any]
    source: str = "zeek_processor"
    sourcetype: str = "zeek_conn_enriched"
    index: str = SPLUNK_INDEX

def get_geoip_data(ip: str) -> Dict[str, Any]:
    """
    Get GeoIP data for an IP address.
    For MVP, we'll use a simple mock implementation.
    In production, you'd use MaxMind GeoIP2 database or similar service.
    """
    if ip.startswith("192.168.") or ip.startswith("10.") or ip == "127.0.0.1":
        return {
            "country": "Private",
            "city": "Private",
            "latitude": None,
            "longitude": None,
            "isp": "Private Network"
        }
    else:
        return {
            "country": "US",
            "city": "New York",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "isp": "Mock ISP"
        }

def enrich_zeek_event(event: ZeekEvent) -> Dict[str, Any]:
    """Enrich Zeek event with GeoIP data"""
    enriched = event.dict()
    if event.id_orig_h:
        enriched["orig_geoip"] = get_geoip_data(event.id_orig_h)
    if event.id_resp_h:
        enriched["resp_geoip"] = get_geoip_data(event.id_resp_h)
    enriched["processed_at"] = time.time()
    enriched["processor_version"] = "1.0.0"
    return enriched

def send_to_splunk_rest(event_data: Dict[str, Any]) -> bool:
    """Send enriched event to Splunk via REST API (alternative to HEC)"""
    try:
        url = f"https://{SPLUNK_HOST}:8089/services/receivers/simple"
        headers = {
            "Authorization": f"Basic {base64.b64encode(f'admin:{SPLUNK_PASSWORD}'.encode()).decode()}",
            "Content-Type": "application/json"
        }
        event_json = json.dumps(event_data)
        response = requests.post(url, headers=headers, data=event_json, timeout=10, verify=SPLUNK_VERIFY_SSL)
        if response.status_code == 200:
            logger.info("Successfully sent event to Splunk REST")
            return True
        else:
            logger.error(f"Failed to send to Splunk REST: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error sending to Splunk REST: {str(e)}")
        return False

def send_to_splunk(event_data: Dict[str, Any]) -> bool:
    """Send enriched event to Splunk via HEC"""
    try:
        url = f"{SPLUNK_SCHEME}://{SPLUNK_HOST}:{SPLUNK_PORT}/services/collector/event"
        headers = {
            "Authorization": f"Splunk {SPLUNK_TOKEN}",
            "Content-Type": "application/json"
        }
        payload = {
            "event": event_data,
            "source": "zeek_processor",
            "sourcetype": "zeek_conn_enriched",
            "index": SPLUNK_INDEX
        }
        response = requests.post(url, headers=headers, json=payload, timeout=10, verify=SPLUNK_VERIFY_SSL)
        if response.status_code == 200:
            logger.info("Successfully sent event to Splunk HEC")
            return True
        else:
            logger.error(f"Failed to send to Splunk HEC: {response.status_code} - {response.text}")
            logger.info("Trying REST API as fallback...")
            return send_to_splunk_rest(event_data)
    except Exception as e:
        logger.error(f"Error sending to Splunk HEC: {str(e)}")
        logger.info("Trying REST API as fallback...")
        return send_to_splunk_rest(event_data)

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "Mini SOC Processor",
        "version": "1.0.0",
        "splunk_host": SPLUNK_HOST,
        "splunk_port": SPLUNK_PORT,
        "splunk_scheme": SPLUNK_SCHEME
    }

@app.post("/process/zeek")
async def process_zeek_event(event: ZeekEvent):
    try:
        enriched_event = enrich_zeek_event(event)
        success = send_to_splunk(enriched_event)
        if success:
            return {
                "status": "success",
                "message": "Event processed and sent to Splunk",
                "enriched_event": enriched_event
            }
        else:
            return {
                "status": "enriched_only",
                "message": "Event enriched but failed to send to Splunk",
                "enriched_event": enriched_event,
                "splunk_status": "failed"
            }
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.post("/process/batch")
async def process_zeek_batch(events: list[ZeekEvent]):
    results = []
    success_count = 0
    for event in events:
        try:
            enriched_event = enrich_zeek_event(event)
            success = send_to_splunk(enriched_event)
            if success:
                success_count += 1
                results.append({"status": "success", "uid": event.uid})
            else:
                results.append({"status": "failed", "uid": event.uid, "error": "Splunk send failed"})
        except Exception as e:
            results.append({"status": "failed", "uid": event.uid, "error": str(e)})
    return {
        "total_events": len(events),
        "successful": success_count,
        "failed": len(events) - success_count,
        "results": results
    }

@app.get("/test/enrich")
async def test_enrichment():
    """Test endpoint to verify enrichment functionality"""
    test_event = ZeekEvent(
        ts="1234567890.123",
        uid="C1234567890",
        id_orig_h="192.168.1.100",
        id_orig_p=12345,
        id_resp_h="8.8.8.8",
        id_resp_p=53,
        proto="udp"
    )
    
    enriched_event = enrich_zeek_event(test_event)
    
    return {
        "status": "success",
        "message": "Enrichment test successful",
        "original_event": test_event.dict(),
        "enriched_event": enriched_event
    }

@app.get("/health")
async def health_check():
    try:
        url = f"{SPLUNK_SCHEME}://{SPLUNK_HOST}:{SPLUNK_PORT}/services/collector/health"
        # A 200 or 401 indicates we can reach HEC endpoint
        response = requests.get(url, timeout=5, verify=SPLUNK_VERIFY_SSL)
        splunk_status = "connected" if response.status_code in (200, 401) else "error"
    except Exception:
        splunk_status = "disconnected"
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "splunk": splunk_status,
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
