# Phase 5: Live Packet Capture - Mini SOC

## 🎯 **Overview**

Phase 5 introduces **real-time network packet capture** capabilities to your Mini SOC, allowing you to monitor live network traffic instead of just processing static PCAP files. This transforms your system from a post-incident analysis tool into a real-time security monitoring platform.

## 🚀 **New Features**

### **Live Network Monitoring**
- **Real-time Capture**: Zeek now captures live traffic from network interfaces
- **Dual Mode Operation**: Switch between PCAP mode and live capture mode
- **Enhanced Logging**: Comprehensive protocol analysis and logging
- **Real-time Alerts**: Immediate detection of network events

### **Enhanced Zeek Configuration**
- **Protocol Coverage**: DNS, HTTP, SSL/TLS, SSH, FTP, SMTP, DHCP, NTP, ICMP
- **Security Focus**: ARP, NTLM, Kerberos, RDP monitoring
- **Custom Logs**: Connection establishment, DNS queries, HTTP requests, SSL connections
- **Summary Statistics**: Real-time connection counting and monitoring

## 🏗️ **Architecture Changes**

### **Docker Compose Services**
```yaml
# PCAP Mode (existing)
zeek:
  profiles: [pcap-mode]
  command: ["-C", "-r", "/pcaps/sample.pcap"]

# Live Capture Mode (new)
zeek-live:
  profiles: [live-mode]
  command: ["-C", "-i", "eth0", "-U", ".status"]
  cap_add: [NET_ADMIN, NET_RAW]
  network_mode: host
```

### **Service Profiles**
- **`pcap-mode`**: Traditional PCAP file processing
- **`live-mode`**: Real-time network interface capture

## 📁 **New Files & Directories**

```
configs/
├── local.zeek          # Enhanced Zeek configuration
scripts/
├── live_capture.sh     # Live capture management script
```

## 🛠️ **Setup & Usage**

### **1. List Available Network Interfaces**
```bash
./scripts/live_capture.sh interfaces
```

**Example Output:**
```
[INFO] Available network interfaces:

  eth0 - UP - 192.168.1.100/24
  wlan0 - UP - 192.168.1.101/24
  lo - UP - 127.0.0.1/8
```

### **2. Start Live Capture Mode**
```bash
# Start on default interface (eth0)
./scripts/live_capture.sh start-live

# Start on specific interface
./scripts/live_capture.sh start-live wlan0
```

**What Happens:**
1. Stops PCAP mode if running
2. Updates interface configuration
3. Starts live capture services
4. Zeek begins monitoring network traffic

### **3. Switch Back to PCAP Mode**
```bash
./scripts/live_capture.sh start-pcap
```

### **4. Check Current Status**
```bash
./scripts/live_capture.sh status
```

### **5. Monitor Live Logs**
```bash
./scripts/live_capture.sh logs live
```

## 🔧 **Configuration Options**

### **Zeek Configuration (`configs/local.zeek`)**
- **Protocol Analyzers**: Enable/disable specific protocol monitoring
- **Log Rotation**: Configure log file rotation intervals
- **Custom Events**: Add custom logging for specific network events
- **Summary Statistics**: Real-time metrics and counting

### **Environment Variables**
```bash
ZEEK_INTERFACE=eth0          # Network interface to monitor
ZEEK_LOG_DIR=/logs          # Directory for log files
```

## 📊 **Enhanced Dashboard**

### **New Status Indicators**
- **Live Capture Status**: Shows if live monitoring is active
- **Real-time Metrics**: Connection counts, packet statistics
- **Top IP Addresses**: Most active source and destination IPs

### **Live Capture Controls**
- **Start Live Mode**: Begin real-time monitoring
- **Switch to PCAP**: Return to file processing mode
- **Check Status**: Monitor current capture state

## 🚨 **Security Considerations**

### **Network Access Requirements**
- **Root Privileges**: Live capture requires elevated permissions
- **Interface Access**: Must have access to target network interface
- **Network Isolation**: Consider monitoring isolated networks only

### **Data Privacy**
- **Sensitive Traffic**: Be aware of capturing sensitive data
- **Log Retention**: Configure appropriate log retention policies
- **Access Control**: Restrict access to captured data

## 🔍 **Monitoring & Troubleshooting**

### **Check Service Status**
```bash
# Check all services
docker compose --profile live-mode ps

# Check specific service
docker compose --profile live-mode logs zeek-live
```

### **Common Issues**

#### **Permission Denied**
```bash
# Error: Permission denied for network interface
# Solution: Ensure container has NET_ADMIN and NET_RAW capabilities
```

#### **Interface Not Found**
```bash
# Error: Interface eth0 not found
# Solution: Use correct interface name from 'interfaces' command
```

#### **No Traffic Captured**
```bash
# Check if interface is active
ip link show eth0

# Verify traffic is flowing
tcpdump -i eth0 -c 5
```

### **Performance Monitoring**
```bash
# Monitor Zeek performance
docker stats zeek-live

# Check log file sizes
ls -lh logs/

# Monitor disk usage
du -sh logs/
```

## 📈 **Performance Considerations**

### **Resource Usage**
- **CPU**: Live capture is CPU-intensive
- **Memory**: Zeek uses memory for connection tracking
- **Disk**: Log files grow continuously
- **Network**: Monitor network overhead

### **Optimization Tips**
- **Filter Traffic**: Use BPF filters to reduce captured traffic
- **Log Rotation**: Implement aggressive log rotation
- **Resource Limits**: Set Docker resource limits
- **Monitoring**: Monitor system resources during capture

## 🔄 **Migration Path**

### **From PCAP to Live Mode**
1. Stop PCAP services: `./scripts/live_capture.sh start-pcap`
2. Start live capture: `./scripts/live_capture.sh start-live`
3. Monitor logs: `./scripts/live_capture.sh logs live`

### **From Live to PCAP Mode**
1. Stop live capture: `./scripts/live_capture.sh start-pcap`
2. Place PCAP files in `./pcaps/` directory
3. Monitor processing: `docker compose --profile pcap-mode logs zeek`

## 🎯 **Next Steps (Future Phases)**

### **Phase 6: Advanced Processing**
- **Real-time Enrichment**: Live GeoIP and threat intelligence
- **Streaming Analytics**: Real-time pattern detection
- **Alert Generation**: Automated security alerts

### **Phase 7: Enhanced Visualization**
- **Real-time Charts**: Live traffic visualization
- **Geographic Maps**: IP location mapping
- **Alert Dashboard**: Security incident monitoring

### **Phase 8: Kubernetes Migration**
- **Scalable Deployment**: Multi-node deployment
- **Persistent Storage**: Long-term log retention
- **Load Balancing**: Distributed processing

## 📚 **Additional Resources**

### **Zeek Documentation**
- [Zeek User Manual](https://docs.zeek.org/en/current/)
- [Zeek Scripts](https://github.com/zeek/zeek-scripts)
- [Protocol Analyzers](https://docs.zeek.org/en/current/scripts/base/protocols/)

### **Network Security**
- [Network Monitoring Best Practices](https://www.sans.org/white-papers/)
- [Packet Analysis Techniques](https://www.wireshark.org/docs/)
- [Security Information and Event Management](https://www.splunk.com/)

## 🆘 **Support & Troubleshooting**

### **Getting Help**
1. Check service logs: `docker compose logs <service-name>`
2. Verify configuration: `./scripts/live_capture.sh status`
3. Test network access: `./scripts/live_capture.sh interfaces`
4. Review this documentation

### **Common Commands Reference**
```bash
# Service management
./scripts/live_capture.sh start-live [interface]
./scripts/live_capture.sh start-pcap
./scripts/live_capture.sh stop
./scripts/live_capture.sh status

# Log monitoring
./scripts/live_capture.sh logs live
./scripts/live_capture.sh logs pcap

# Interface management
./scripts/live_capture.sh interfaces
```

---

**🎉 Congratulations!** You've successfully implemented Phase 5: Live Packet Capture. Your Mini SOC now has real-time network monitoring capabilities, making it a powerful tool for live security analysis and incident response.
