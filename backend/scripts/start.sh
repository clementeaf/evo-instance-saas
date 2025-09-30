#!/bin/bash

echo "🚀 Starting Evolution API SaaS"
echo "=============================="

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Start Evolution API
echo "🐳 Starting Evolution API..."
docker-compose up -d

# Wait for Evolution API to be ready
echo "⏳ Waiting for Evolution API to start..."
sleep 15

# Check if Evolution API is running
if curl -s http://localhost:8080/ > /dev/null; then
    echo "✅ Evolution API is running on http://localhost:8080"
else
    echo "❌ Evolution API failed to start"
    exit 1
fi

# Start backend in development mode
echo "🚀 Starting backend server..."
npm run dev &

# Wait for backend to start
sleep 5

if curl -s http://localhost:8200/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:8200"
else
    echo "❌ Backend failed to start"
    exit 1
fi

echo ""
echo "🎉 SaaS started successfully!"
echo "============================="
echo "📱 Evolution API: http://localhost:8080"
echo "🚀 Backend API: http://localhost:8200"
echo "🏥 Health check: http://localhost:8200/health"
echo ""
echo "📋 Next steps:"
echo "1. Run: npm run setup-whatsapp"
echo "2. Scan QR with your phone"
echo "3. Test: npm run send-message"