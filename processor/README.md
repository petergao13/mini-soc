# Mini SOC Processor

A FastAPI-based data processor that enriches Zeek network logs with GeoIP data and forwards them to Splunk via HTTP Event Collector (HEC).

## Features

- **Zeek Log Processing**: Parses and processes Zeek connection logs
- **GeoIP Enrichment**: Adds geographic location data to IP addresses
- **Splunk HEC Integration**: Sends enriched events to Splunk via HTTP Event Collector
- **Batch Processing**: Supports processing multiple events at once
- **Health Monitoring**: Provides health check endpoints

## Architecture

```
Zeek Logs → FastAPI Processor → Splunk HEC
                ↓
            GeoIP Enrichment
```

## API Endpoints

### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed health check with Splunk connectivity

### Event Processing
- `POST /process/zeek` - Process a single Zeek event
- `POST /process/batch` - Process multiple Zeek events

## Environment Variables

- `SPLUNK_HOST` - Splunk hostname (default: splunk)
- `SPLUNK_PORT` - Splunk HEC port (default: 8088)
- `SPLUNK_TOKEN` - Splunk HEC token
- `SPLUNK_INDEX` - Splunk index name (default: main)

## Usage

### Running with Docker Compose
```bash
docker compose up processor
```

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:8001/health

# Test single event processing
curl -X POST http://localhost:8001/process/zeek \
  -H "Content-Type: application/json" \
  -d '{
    "ts": "1234567890.123",
    "uid": "C1234567890",
    "id_orig_h": "192.168.1.100",
    "id_orig_p": 12345,
    "id_resp_h": "8.8.8.8",
    "id_resp_p": 53,
    "proto": "udp"
  }'
```

### Processing Zeek Log Files
```bash
# Use the log parser utility
python log_parser.py /path/to/conn.log http://localhost:8001
```

## GeoIP Enrichment

The processor adds the following GeoIP fields to each event:
- `orig_geoip` - Geographic data for source IP
- `resp_geoip` - Geographic data for destination IP

Each GeoIP object contains:
- `country` - Country name
- `city` - City name
- `latitude` - Latitude coordinate
- `longitude` - Longitude coordinate
- `isp` - Internet Service Provider

**Note**: Current implementation uses mock GeoIP data. For production, integrate with MaxMind GeoIP2 or similar service.

## Splunk Integration

Enriched events are sent to Splunk with:
- `sourcetype`: `zeek_conn_enriched`
- `source`: `zeek_processor`
- `index`: Configured via `SPLUNK_INDEX` environment variable

## Development

### Local Development
```bash
cd processor
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### API Documentation
Once running, visit:
- http://localhost:8001/docs - Interactive API documentation
- http://localhost:8001/redoc - Alternative API documentation
