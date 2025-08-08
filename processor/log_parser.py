#!/usr/bin/env python3
"""
Zeek Log Parser
Reads Zeek log files and sends events to the FastAPI processor for enrichment.
"""

import os
import sys
import time
import json
import requests
from typing import Dict, List, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ZeekLogParser:
    def __init__(self, processor_url: str = "http://localhost:8001"):
        self.processor_url = processor_url
        self.field_names = []
        
    def parse_zeek_header(self, header_lines: List[str]) -> List[str]:
        """Parse Zeek log header to extract field names"""
        field_names = []
        
        for line in header_lines:
            if line.startswith("#fields"):
                # Extract field names from #fields line
                fields_part = line.split('\t', 1)[1]
                field_names = fields_part.strip().split('\t')
                break
                
        return field_names
    
    def parse_zeek_line(self, line: str, field_names: List[str]) -> Dict[str, Any]:
        """Parse a single Zeek log line into a dictionary"""
        if line.startswith('#') or not line.strip():
            return None
            
        values = line.strip().split('\t')
        
        # Ensure we have the right number of fields
        if len(values) != len(field_names):
            logger.warning(f"Field count mismatch: {len(values)} vs {len(field_names)}")
            return None
            
        # Create event dictionary
        event = {}
        for i, field_name in enumerate(field_names):
            value = values[i]
            
            # Convert empty fields to None
            if value == "(empty)" or value == "-":
                value = None
            else:
                # Try to convert numeric fields
                try:
                    if '.' in value:
                        value = float(value)
                    else:
                        value = int(value)
                except (ValueError, TypeError):
                    # Keep as string if conversion fails
                    pass
                    
            event[field_name] = value
            
        return event
    
    def parse_zeek_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Parse a Zeek log file and return list of events"""
        events = []
        
        try:
            with open(file_path, 'r') as f:
                lines = f.readlines()
                
            # Parse header to get field names
            header_lines = [line for line in lines if line.startswith('#')]
            field_names = self.parse_zeek_header(header_lines)
            
            if not field_names:
                logger.error("Could not parse field names from header")
                return []
                
            logger.info(f"Parsed {len(field_names)} fields: {field_names}")
            
            # Parse data lines
            for line in lines:
                if not line.startswith('#') and line.strip():
                    event = self.parse_zeek_line(line, field_names)
                    if event:
                        events.append(event)
                        
            logger.info(f"Parsed {len(events)} events from {file_path}")
            return events
            
        except Exception as e:
            logger.error(f"Error parsing file {file_path}: {str(e)}")
            return []
    
    def send_to_processor(self, events: List[Dict[str, Any]]) -> bool:
        """Send events to the FastAPI processor"""
        if not events:
            return True
            
        try:
            url = f"{self.processor_url}/process/batch"
            response = requests.post(url, json=events, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Successfully sent {result['successful']}/{result['total_events']} events to processor")
                return result['successful'] == result['total_events']
            else:
                logger.error(f"Failed to send to processor: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending to processor: {str(e)}")
            return False
    
    def process_log_file(self, file_path: str) -> bool:
        """Process a single Zeek log file"""
        logger.info(f"Processing log file: {file_path}")
        
        # Parse the file
        events = self.parse_zeek_file(file_path)
        
        if not events:
            logger.warning(f"No events found in {file_path}")
            return True
            
        # Send to processor
        return self.send_to_processor(events)

def main():
    """Main function for command-line usage"""
    if len(sys.argv) < 2:
        print("Usage: python log_parser.py <log_file> [processor_url]")
        sys.exit(1)
        
    log_file = sys.argv[1]
    processor_url = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8001"
    
    if not os.path.exists(log_file):
        print(f"Log file not found: {log_file}")
        sys.exit(1)
        
    parser = ZeekLogParser(processor_url)
    success = parser.process_log_file(log_file)
    
    if success:
        print("Log processing completed successfully")
        sys.exit(0)
    else:
        print("Log processing failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
