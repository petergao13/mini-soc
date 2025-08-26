#!/usr/bin/env python3
"""
Log Watcher for Mini SOC
Monitors Zeek log files and sends new entries to the processor API
"""

import os
import time
import requests
import json
from pathlib import Path
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

class LogWatcher:
    def __init__(self, logs_dir: str = "/app/logs", processor_url: str = "http://localhost:8001"):
        self.logs_dir = Path(logs_dir)
        self.processor_url = processor_url
        self.processed_files = set()
        self.file_positions = {}
        
    def get_log_files(self) -> List[Path]:
        """Get all Zeek log files (excluding .status and log_watcher.log)"""
        log_files = []
        for file_path in self.logs_dir.glob("*.log"):
            if file_path.name not in [".status", "log_watcher.log"]:
                log_files.append(file_path)
        return log_files
    
    def read_new_lines(self, file_path: Path) -> List[str]:
        """Read new lines from a file since last check"""
        try:
            current_pos = self.file_positions.get(str(file_path), 0)
            
            with open(file_path, 'r') as f:
                f.seek(current_pos)
                new_lines = f.readlines()
                self.file_positions[str(file_path)] = f.tell()
                
            return new_lines
        except Exception as e:
            logging.error(f"Error reading {file_path}: {e}")
            return []
    
    def parse_zeek_line(self, line: str) -> Optional[Dict]:
        """Parse a Zeek log line into structured data"""
        try:
            if line.startswith('#') or not line.strip():
                return None
                
            # Split by tab and map fields
            parts = line.strip().split('\t')
            if len(parts) < 2:
                return None
                
            # Basic parsing - this is a simplified version
            # In production, you'd want more sophisticated parsing
            return {
                "raw_line": line.strip(),
                "timestamp": parts[0] if parts else "",
                "data": parts[1:] if len(parts) > 1 else []
            }
        except Exception as e:
            logging.error(f"Error parsing line: {e}")
            return None
    
    def send_to_processor(self, events: List[Dict]) -> bool:
        """Send events to the processor API"""
        if not events:
            return True
            
        # Split large batches into smaller chunks to avoid timeouts
        batch_size = 1000
        total_sent = 0
        
        for i in range(0, len(events), batch_size):
            batch = events[i:i + batch_size]
            try:
                response = requests.post(
                    f"{self.processor_url}/process/batch",
                    json=batch,
                    timeout=30
                )
                
                if response.status_code == 200:
                    total_sent += len(batch)
                    logging.info(f"Successfully sent batch of {len(batch)} events to processor")
                else:
                    logging.error(f"Processor API error: {response.status_code} - {response.text}")
                    return False
                    
            except Exception as e:
                logging.error(f"Error sending batch to processor: {e}")
                return False
        
        logging.info(f"Successfully sent total of {total_sent} events to processor")
        return True
    
    def process_log_file(self, file_path: Path):
        """Process a single log file for new entries"""
        try:
            new_lines = self.read_new_lines(file_path)
            if not new_lines:
                return
                
            events = []
            for line in new_lines:
                parsed = self.parse_zeek_line(line)
                if parsed:
                    events.append(parsed)
            
            if events:
                logging.info(f"Processing {len(events)} new events from {file_path.name}")
                self.send_to_processor(events)
                
        except Exception as e:
            logging.error(f"Error processing {file_path}: {e}")
    
    def run(self, interval: int = 5):
        """Main loop to monitor log files"""
        logging.info(f"Starting log watcher for directory: {self.logs_dir}")
        logging.info(f"Processor URL: {self.processor_url}")
        
        while True:
            try:
                log_files = self.get_log_files()
                
                for file_path in log_files:
                    if file_path.exists():
                        self.process_log_file(file_path)
                
                time.sleep(interval)
                
            except KeyboardInterrupt:
                logging.info("Log watcher stopped by user")
                break
            except Exception as e:
                logging.error(f"Unexpected error in main loop: {e}")
                time.sleep(interval)

if __name__ == "__main__":
    # Get environment variables
    logs_dir = os.getenv("LOGS_DIR", "/app/logs")
    processor_url = os.getenv("PROCESSOR_URL", "http://127.0.0.1:8001")
    
    watcher = LogWatcher(logs_dir, processor_url)
    watcher.run()
