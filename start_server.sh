#!/bin/bash
cd "$(dirname "$0")/web-dashboard"
echo "Starting API server on http://localhost:8000"
echo "Make sure AGNES_API_KEY and TYPESAFE_API_KEY are set in your environment"
echo ""
uvicorn server:app --reload --port 8000 --host 0.0.0.0
