#!/bin/bash

# Development startup script
# This script helps you start all services needed for development

echo "🚀 Starting EvoInstance SaaS Development Environment"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed"
    echo ""
    echo "Install with: brew install ngrok"
    echo "Then run: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    echo "See backend/NGROK_SETUP.md for complete instructions"
    exit 1
fi

echo "✅ ngrok is installed"
echo ""

# Check if backend is ready
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if frontend is ready
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "🎯 Starting services..."
echo ""
echo "You need to run these in SEPARATE terminals:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 (ngrok):"
echo "  ngrok http 8200"
echo ""
echo "Terminal 3 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "After starting ngrok:"
echo "  1. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)"
echo "  2. Update backend/.env:"
echo "     PUBLIC_WEBHOOK_URL=https://abc123.ngrok.io"
echo "  3. Restart backend to apply changes"
echo ""
echo "📚 Documentation:"
echo "  - Webhook setup: backend/NGROK_SETUP.md"
echo "  - Messaging providers: backend/MESSAGING_PROVIDERS.md"
echo ""
