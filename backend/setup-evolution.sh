#!/bin/bash

echo "🚀 Evolution API v2 Setup Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is required but not installed.${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is required but not installed.${NC}"
    echo "Please install Docker Compose first"
    exit 1
fi

echo -e "${BLUE}📋 Step 1: Starting Evolution API with PostgreSQL...${NC}"
docker-compose -f docker-compose.evolution.yml up -d

# Wait for services to start
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

# Check if containers are running
if [ "$(docker ps -q -f name=evolution_api)" ] && [ "$(docker ps -q -f name=evolution_postgres)" ]; then
    echo -e "${GREEN}✅ Evolution API containers are running${NC}"
else
    echo -e "${RED}❌ Failed to start Evolution API containers${NC}"
    docker-compose -f docker-compose.evolution.yml logs
    exit 1
fi

echo -e "${BLUE}📋 Step 2: Installing Node.js dependencies...${NC}"
npm install

echo -e "${BLUE}📋 Step 3: Building the application...${NC}"
npm run build

echo -e "${BLUE}📋 Step 4: Setting up DynamoDB tables...${NC}"
if [ -f ".env" ]; then
    source .env
    if [ "$DYNAMO_ENDPOINT" != "" ]; then
        echo "Using local DynamoDB endpoint: $DYNAMO_ENDPOINT"
    fi
    npm run db:bootstrap
else
    echo -e "${YELLOW}⚠️  .env file not found. Please configure AWS credentials manually.${NC}"
fi

echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Configure ngrok for public webhook:"
echo "   ${YELLOW}ngrok http 3000${NC}"
echo ""
echo "2. Update PUBLIC_WEBHOOK_URL in .env with ngrok URL"
echo ""
echo "3. Create WhatsApp instance:"
echo "   ${YELLOW}npm run create:instance${NC}"
echo ""
echo "4. Start the application:"
echo "   ${YELLOW}npm run dev${NC} (Terminal 1)"
echo "   ${YELLOW}npm run worker${NC} (Terminal 2)"
echo ""
echo "5. Access Evolution API at: ${BLUE}http://localhost:8080${NC}"
echo "6. Scan QR code to connect WhatsApp"
echo ""
echo -e "${BLUE}🔍 Useful commands:${NC}"
echo "- View Evolution API logs: ${YELLOW}docker-compose -f docker-compose.evolution.yml logs -f evolution-api${NC}"
echo "- View PostgreSQL logs: ${YELLOW}docker-compose -f docker-compose.evolution.yml logs -f postgres${NC}"
echo "- Stop all services: ${YELLOW}docker-compose -f docker-compose.evolution.yml down${NC}"
echo "- Health check: ${YELLOW}curl http://localhost:3000/health${NC}"