#!/bin/bash

# Live Packet Capture Management Script for Mini SOC
# This script helps manage the transition between PCAP and live capture modes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
LOGS_DIR="./logs"
CONFIGS_DIR="./configs"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Mini SOC Live Capture Manager${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if docker compose is available
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available"
        exit 1
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    print_status "Prerequisites check passed ✓"
}

# Function to list available network interfaces
list_interfaces() {
    print_status "Available network interfaces:"
    echo ""
    
    # Get all network interfaces
    interfaces=$(ip link show | grep -E '^[0-9]+:' | cut -d: -f2 | tr -d ' ')
    
    for interface in $interfaces; do
        # Skip loopback and docker interfaces
        if [[ "$interface" != "lo" && ! "$interface" =~ ^docker && ! "$interface" =~ ^veth ]]; then
            # Get interface status
            if ip link show "$interface" | grep -q "UP"; then
                status="UP"
                status_color="${GREEN}"
            else
                status="DOWN"
                status_color="${RED}"
            fi
            
            # Get IP address if available
            ip_addr=$(ip addr show "$interface" | grep -E 'inet ' | awk '{print $2}' | head -1)
            if [ -n "$ip_addr" ]; then
                echo -e "  ${BLUE}$interface${NC} - ${status_color}$status${NC} - $ip_addr"
            else
                echo -e "  ${BLUE}$interface${NC} - ${status_color}$status${NC} - No IP"
            fi
        fi
    done
    echo ""
}

# Function to start live capture mode
start_live_capture() {
    local interface=${1:-"eth0"}
    
    print_status "Starting live packet capture on interface: $interface"
    
    # Stop PCAP mode if running
    if docker compose --profile pcap-mode ps | grep -q "zeek"; then
        print_warning "Stopping PCAP mode..."
        docker compose --profile pcap-mode down
    fi
    
    # Update interface in docker-compose
    if [ "$interface" != "eth0" ]; then
        print_status "Updating interface configuration to: $interface"
        sed -i "s/-i eth0/-i $interface/g" "$COMPOSE_FILE"
        sed -i "s/ZEEK_INTERFACE=eth0/ZEEK_INTERFACE=$interface/g" "$COMPOSE_FILE"
    fi
    
    # Start live capture mode
    print_status "Starting services in live capture mode..."
    docker compose --profile live-mode up -d
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check service status
    docker compose --profile live-mode ps
    
    print_status "Live capture mode started ✓"
    print_status "Zeek is now capturing live traffic from interface: $interface"
    print_status "Logs are being written to: $LOGS_DIR"
    print_status "Monitor logs with: docker-compose --profile live-mode logs -f zeek-live"
}

# Function to start PCAP mode
start_pcap_mode() {
    print_status "Starting PCAP processing mode..."
    
    # Stop live capture mode if running
    if docker compose --profile live-mode ps | grep -q "zeek-live"; then
        print_warning "Stopping live capture mode..."
        docker compose --profile live-mode down
    fi
    
    # Start PCAP mode
    docker compose --profile pcap-mode up -d
    
    print_status "PCAP mode started ✓"
    print_status "Place PCAP files in ./pcaps directory for processing"
}

# Function to check capture status
check_status() {
    print_status "Checking capture status..."
    echo ""
    
    # Check if any Zeek service is running
    if docker compose --profile live-mode ps | grep -q "zeek-live"; then
        print_status "Live capture mode is ACTIVE"
        docker compose --profile live-mode ps zeek-live
        echo ""
        
        # Check log files
        if [ -d "$LOGS_DIR" ]; then
            print_status "Recent log files:"
            find "$LOGS_DIR" -name "*.log" -type f -exec ls -lh {} \; | head -10
        fi
        
    elif docker compose --profile pcap-mode ps | grep -q "zeek"; then
        print_status "PCAP mode is ACTIVE"
        docker compose --profile pcap-mode ps zeek
        
    else
        print_warning "No capture mode is currently active"
    fi
}

# Function to show logs
show_logs() {
    local mode=${1:-"live"}
    
    if [ "$mode" = "live" ]; then
        print_status "Showing live capture logs..."
        docker compose --profile live-mode logs -f zeek-live
    elif [ "$mode" = "pcap" ]; then
        print_status "Showing PCAP mode logs..."
        docker compose --profile pcap-mode logs -f zeek
    else
        print_error "Invalid mode. Use 'live' or 'pcap'"
        exit 1
    fi
}

# Function to stop all services
stop_all() {
    print_status "Stopping all services..."
    docker compose --profile live-mode down
    docker compose --profile pcap-mode down
    print_status "All services stopped ✓"
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start-live [INTERFACE]  Start live packet capture (default: eth0)"
    echo "  start-pcap              Start PCAP processing mode"
    echo "  stop                    Stop all services"
    echo "  status                  Check current capture status"
    echo "  logs [MODE]            Show logs (MODE: live or pcap)"
    echo "  interfaces              List available network interfaces"
    echo "  help                    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start-live          Start live capture on default interface (eth0)"
    echo "  $0 start-live wlan0    Start live capture on wlan0 interface"
    echo "  $0 start-pcap          Start PCAP processing mode"
    echo "  $0 status              Check current status"
    echo "  $0 logs live           Show live capture logs"
}

# Main script logic
main() {
    print_header
    
    # Check prerequisites
    check_prerequisites
    
    case "${1:-help}" in
        "start-live")
            start_live_capture "$2"
            ;;
        "start-pcap")
            start_pcap_mode
            ;;
        "stop")
            stop_all
            ;;
        "status")
            check_status
            ;;
        "logs")
            show_logs "$2"
            ;;
        "interfaces")
            list_interfaces
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
