#!/bin/bash

# Script to start the backend server safely
# This script kills any existing server and starts a fresh one

PORT=8200
PROCESS_NAME="dev-server.ts"

echo "🔍 Checking for existing server on port $PORT..."

# Find and kill any process using the port
PID=$(lsof -ti:$PORT)
if [ ! -z "$PID" ]; then
  echo "⚠️  Found existing process on port $PORT (PID: $PID)"
  echo "🔪 Killing process..."
  kill -9 $PID
  sleep 2
  echo "✅ Process killed"
else
  echo "✅ Port $PORT is available"
fi

# Find and kill any ts-node-dev processes running dev-server.ts
echo "🔍 Checking for orphaned $PROCESS_NAME processes..."
ORPHAN_PIDS=$(ps aux | grep "$PROCESS_NAME" | grep -v grep | awk '{print $2}')
if [ ! -z "$ORPHAN_PIDS" ]; then
  echo "⚠️  Found orphaned processes: $ORPHAN_PIDS"
  echo "🔪 Killing orphaned processes..."
  echo "$ORPHAN_PIDS" | xargs kill -9 2>/dev/null
  sleep 2
  echo "✅ Orphaned processes killed"
else
  echo "✅ No orphaned processes found"
fi

echo ""
echo "🚀 Starting server..."
echo ""

# Start the server
npm run dev
