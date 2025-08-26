#!/bin/bash

# Start the FastAPI server in the background
echo "Starting FastAPI server..."
uvicorn main:app --host 0.0.0.0 --port 8001 --reload &

# Wait for the server to be ready
echo "Waiting for server to be ready..."
sleep 10

# Start the log watcher
echo "Starting log watcher..."
python log_watcher.py

# Keep the script running
wait
