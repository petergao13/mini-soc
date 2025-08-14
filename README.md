 Mini SOC Project

## Overview
This project is a containerized mini Security Operations Center (SOC) designed to monitor network traffic, extract meaningful events, and present them through a searchable and visual interface.

## Core Components
- **Zeek**: Network traffic analyzer that generates structured logs.
- **Splunk**: Log indexing and search engine for storing and visualizing Zeek data.
- **Frontend**: Web interface for interacting with Splunk via REST API.
- **Processor** *(optional)*: Middleware that enriches or filters Zeek logs before forwarding them to Splunk.

## Project Goals
- Analyze packet data using Zeek
- Ingest and index logs in Splunk
- Query and visualize results through a UI
- Enable optional data processing and alerting
- Orchestrate all services using Docker Compose (later Kubernetes)


## Project Development Phases (Summary)
**Phase 0**: Project initialization and structure setup
**Phase 1**: Zeek container setup with offline PCAPs
**Phase 2**: Splunk container setup with Zeek log ingestion
**Phase 3**: Integrate Zeek and Splunk with Docker Compose
**Phase 4**: Basic frontend interface using REST API
**Phase 5**: Live Packet Capture Mode
**Phase 6**: Implement processor logic and Splunk HEC ingestion
**Phase 7**: Finalize frontend with data visualizations and filters
**Phase 8**: Migrate to Kubernetes for production orchestration

## 🚀 Quick Start Guide

### Prerequisites
- Docker and Docker Compose installed
- Git installed
- At least 4GB RAM available
- Ports 3000, 8000, 8001, and 8088 available

### Step 1: Clone and Setup
```bash
# Clone the repository
git clone <your-github-repo-url>
cd mini-soc

# Create environment file
echo "SPLUNK_PASSWORD=admin123" > .env
echo "SPLUNK_TOKEN=00000000-0000-0000-0000-000000000000" >> .env
```

### Step 2: Generate PCAP File (Optional)
```bash
# Generate a sample PCAP file (requires sudo for packet capture)
sudo tcpdump -i any -w pcaps/sample.pcap -c 100
# OR copy an existing PCAP file to the pcaps/ directory
```

### Step 3: Start the System
```bash
# Start all services
docker compose up -d

# Check service status
docker compose ps

# View logs for any service
docker compose logs <service-name>
```

### Step 4: Access the System
- **Frontend Dashboard**: http://localhost:3000
- **Splunk SIEM**: http://localhost:8000 (admin/admin123)
- **Processor API**: http://localhost:8001
- **Splunk HEC**: https://localhost:8088

### Step 5: Configure Splunk HEC (First Time Only)
1. Open Splunk at http://localhost:8000
2. Login with admin/admin123
3. Go to Settings → Data Inputs → HTTP Event Collector
4. Click "Global Settings" → Enable HEC → Save
5. Click "New Token" → Name it "mini-soc" → Save
6. Copy the token and update `.env` file:
   ```bash
   echo "SPLUNK_TOKEN=<your-actual-token>" > .env
   ```
7. Restart the processor:
   ```bash
   docker compose restart processor
   ```

### Step 6: Test the System
```bash
# Test processor health
curl http://localhost:8001/health

# Test frontend API
curl http://localhost:3000/api/processor/health

# Send test event to processor
curl -X POST http://localhost:8001/process/zeek \
  -H "Content-Type: application/json" \
  -d '{"ts":"1234567890.123","uid":"TEST123","id_orig_h":"192.168.1.100","id_orig_p":1234,"id_resp_h":"8.8.8.8","id_resp_p":53,"proto":"udp"}'
```

## 🔧 Troubleshooting

### Common Commands
```bash
# Check all service status
docker compose ps

# View logs for specific service
docker compose logs frontend
docker compose logs processor
docker compose logs splunk

# Restart specific service
docker compose restart <service-name>

# Rebuild and restart specific service
docker compose up <service-name> --build -d

# Stop all services
docker compose down

# Stop and remove all data
docker compose down -v
```

### Service Dependencies
- **Splunk** starts first (takes 5-10 minutes for first startup)
- **Processor** depends on Splunk
- **Frontend** depends on processor
- **Zeek** can run independently

### Expected Startup Time
- **First run**: 10-15 minutes (Splunk initialization + builds)
- **Subsequent runs**: 2-3 minutes

### Verification Checklist
- [ ] All containers show "Up" status
- [ ] Frontend accessible at http://localhost:3000
- [ ] Splunk accessible at http://localhost:8000
- [ ] Processor health endpoint returns 200 OK
- [ ] Frontend shows processor status as "Connected"
- [ ] Test event can be sent to processor

### Common Issues & Solutions

**Issue**: Frontend stuck on loading spinner
- **Solution**: Check processor logs, ensure API routes are working

**Issue**: Splunk won't start
- **Solution**: Check if port 8000 is available, ensure sufficient memory

**Issue**: Processor can't connect to Splunk
- **Solution**: Verify HEC token in .env, check Splunk HEC is enabled

**Issue**: Build failures
- **Solution**: Ensure Docker has sufficient resources, check internet connection for package downloads
