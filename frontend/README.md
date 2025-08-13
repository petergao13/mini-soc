# Mini SOC Frontend

A modern, responsive Next.js dashboard for the Mini Security Operations Center (SOC) that provides real-time visualization of network traffic analysis and security events.

## Features

- **Real-time Dashboard**: Live monitoring of system status and network events
- **System Health Monitoring**: Status indicators for Zeek, Splunk, and Processor services
- **Network Analytics**: Protocol distribution, unique IP tracking, and connection monitoring
- **Alert Management**: Real-time security alerts with severity classification
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **Modern UI**: Clean, professional interface using Heroicons and modern design patterns

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Charts**: Recharts (ready for future implementation)
- **HTTP Client**: Axios

## Architecture

```
Frontend (Next.js) → API Routes → Backend Services
     ↓
- Processor Health Checks
- Splunk Data Integration
- Real-time Updates
```

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Docker Deployment

```bash
# Build and run with docker-compose
docker compose up frontend

# Or build individually
docker build -t mini-soc-frontend .
docker run -p 3000:3000 mini-soc-frontend
```

## API Integration

The frontend integrates with the following backend services:

### Processor API
- `GET /api/processor/health` - Check processor health status
- `POST /api/processor/process/zeek` - Process Zeek events
- `POST /api/processor/process/batch` - Process multiple events

### Splunk Integration
- `GET /api/splunk/` - Access Splunk UI (proxy)
- Real-time data visualization (future enhancement)

## Dashboard Components

### System Status
- Real-time health monitoring of all services
- Visual indicators for service status
- Automatic refresh every 30 seconds

### Statistics Cards
- Total Events: Count of processed network events
- Unique IPs: Number of distinct IP addresses
- Active Connections: Current network connections
- Alerts Today: Security alerts count

### Protocol Distribution
- Visual breakdown of network protocols
- Percentage-based progress bars
- Real-time updates

### Recent Alerts
- Security alert timeline
- Severity-based color coding
- Timestamp and description

### Quick Actions
- Process New PCAP: Trigger new analysis
- View All Events: Navigate to detailed view
- Export Report: Generate security reports

## Environment Variables

```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## Development Notes

### API Proxying
The frontend uses Next.js API routes to proxy requests to backend services, ensuring proper CORS handling and service discovery.

### Real-time Updates
Currently uses polling for updates. Future versions will implement WebSocket connections for true real-time updates.

### Responsive Design
Built with mobile-first approach using Tailwind CSS breakpoints.

## Future Enhancements

- **WebSocket Integration**: Real-time data streaming
- **Advanced Charts**: Interactive network topology maps
- **User Authentication**: Role-based access control
- **Custom Dashboards**: User-configurable widgets
- **Export Functionality**: PDF/CSV report generation
- **Dark Mode**: Theme switching capability

## Contributing

1. Follow TypeScript best practices
2. Use Tailwind CSS for styling
3. Implement proper error handling
4. Add TypeScript interfaces for all data structures
5. Test responsive design on multiple screen sizes
