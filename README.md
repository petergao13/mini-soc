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
