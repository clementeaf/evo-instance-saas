#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
EVOLUTION_API_URL="http://localhost:8080"
EVOLUTION_API_KEY="evolution-api-key-2024"
BACKEND_API_URL="http://localhost:8200/api/v1"
BACKEND_API_KEY="pk_live_test"

# Arguments
INSTANCE_NAME=${1:-"whatsapp-$(date +%s)"}
TEST_PHONE=${2:-""}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 WhatsApp Instance Setup (Direct)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Instance Name:${NC} $INSTANCE_NAME"
if [ ! -z "$TEST_PHONE" ]; then
  echo -e "${YELLOW}Test Phone:${NC} $TEST_PHONE"
fi
echo ""

# Step 1: Create Instance directly in Evolution API
echo -e "${BLUE}[1/5]${NC} Creating WhatsApp instance in Evolution API..."

CREATE_RESPONSE=$(curl -s -X POST "$EVOLUTION_API_URL/instance/create" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"instanceName\": \"$INSTANCE_NAME\",
    \"webhook\": \"http://host.docker.internal:8200/webhooks/wa\",
    \"webhook_by_events\": false,
    \"webhook_base64\": false,
    \"events\": [
      \"MESSAGES_UPSERT\",
      \"MESSAGES_UPDATE\",
      \"CONNECTION_UPDATE\",
      \"QRCODE_UPDATED\"
    ]
  }")

INSTANCE_KEY=$(echo $CREATE_RESPONSE | jq -r '.instance.instanceName // empty')

if [ -z "$INSTANCE_KEY" ]; then
  # Check if instance already exists
  EXISTING=$(echo $CREATE_RESPONSE | jq -r '.message[0] // empty')
  if [[ $EXISTING == *"already in use"* ]]; then
    echo -e "${YELLOW}⚠️  Instance '$INSTANCE_NAME' already exists, using it...${NC}"
    INSTANCE_KEY=$INSTANCE_NAME
  else
    echo -e "${RED}❌ Failed to create instance${NC}"
    echo $CREATE_RESPONSE | jq
    exit 1
  fi
else
  echo -e "${GREEN}✅ Instance created: $INSTANCE_KEY${NC}"
fi

echo ""

# Step 2: Get QR Code
echo -e "${BLUE}[2/5]${NC} Generating QR Code..."
sleep 2

QR_RESPONSE=$(curl -s -X GET "$EVOLUTION_API_URL/instance/connect/$INSTANCE_KEY" \
  -H "apikey: $EVOLUTION_API_KEY")

QR_CODE=$(echo $QR_RESPONSE | jq -r '.base64 // empty')

if [ -z "$QR_CODE" ]; then
  echo -e "${RED}❌ Failed to get QR code${NC}"
  echo $QR_RESPONSE | jq
  exit 1
fi

# Save QR Code
QR_FILE="qr_${INSTANCE_NAME}.png"
echo $QR_CODE | sed 's/data:image\/png;base64,//' | base64 -d > "$QR_FILE"
echo -e "${GREEN}✅ QR Code saved: $QR_FILE${NC}"

# Open QR Code
if command -v open &> /dev/null; then
  open "$QR_FILE"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$QR_FILE"
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📱 SCAN THIS QR WITH YOUR PHONE:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "1. Open WhatsApp on your phone"
echo "2. Go to Settings → Linked Devices"
echo "3. Tap 'Link a Device'"
echo "4. Scan the QR code that opened"
echo ""

# Step 3: Wait for Connection
echo -e "${BLUE}[3/5]${NC} Waiting for WhatsApp connection..."

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  STATUS_RESPONSE=$(curl -s -X GET "$EVOLUTION_API_URL/instance/connectionState/$INSTANCE_KEY" \
    -H "apikey: $EVOLUTION_API_KEY")

  STATUS=$(echo $STATUS_RESPONSE | jq -r '.instance.state // empty')

  if [ "$STATUS" = "open" ]; then
    echo -e "${GREEN}✅ WhatsApp connected successfully!${NC}"
    break
  fi

  echo -ne "${YELLOW}⏳ Status: $STATUS ... (attempt $((ATTEMPT+1))/$MAX_ATTEMPTS)\r${NC}"
  sleep 2
  ATTEMPT=$((ATTEMPT+1))
done

if [ "$STATUS" != "open" ]; then
  echo -e "\n${RED}❌ Timeout waiting for connection${NC}"
  echo -e "${YELLOW}💡 Please try again or check if QR code expired${NC}"
  exit 1
fi

echo ""
echo ""

# Step 4: Send Test Message (if phone provided)
if [ ! -z "$TEST_PHONE" ]; then
  echo -e "${BLUE}[4/5]${NC} Sending test message to $TEST_PHONE..."

  # Clean phone number (remove +)
  CLEAN_PHONE=$(echo $TEST_PHONE | sed 's/+//')

  SEND_RESPONSE=$(curl -s -X POST "$BACKEND_API_URL/messages/send" \
    -H "Authorization: Bearer $BACKEND_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"instance_id\": \"$INSTANCE_NAME\",
      \"to\": \"$TEST_PHONE\",
      \"message\": \"🎉 WhatsApp conectado exitosamente!\n\n✅ Instance: $INSTANCE_NAME\n⏰ Hora: $(date '+%H:%M:%S')\n📅 Fecha: $(date '+%d/%m/%Y')\n\n¡Tu SaaS está listo para enviar mensajes!\"
    }")

  MESSAGE_STATUS=$(echo $SEND_RESPONSE | jq -r '.data.status // empty')

  if [ "$MESSAGE_STATUS" = "sent" ]; then
    MESSAGE_ID=$(echo $SEND_RESPONSE | jq -r '.data.id')
    echo -e "${GREEN}✅ Test message sent successfully!${NC}"
    echo -e "${GREEN}   Message ID: $MESSAGE_ID${NC}"
  else
    echo -e "${RED}❌ Failed to send test message${NC}"
    echo $SEND_RESPONSE | jq
  fi
else
  echo -e "${BLUE}[4/5]${NC} ${YELLOW}Skipping test message (no phone provided)${NC}"
fi

echo ""

# Step 5: Summary
echo -e "${BLUE}[5/5]${NC} Setup complete!"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ SUCCESS! Your WhatsApp is ready!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📋 Instance Details:${NC}"
echo "   Instance Name: $INSTANCE_NAME"
echo "   Status:        connected"
echo ""
echo -e "${YELLOW}🚀 Send messages using Backend API:${NC}"
echo ""
echo -e "${BLUE}curl -X POST $BACKEND_API_URL/messages/send \\${NC}"
echo -e "${BLUE}  -H \"Authorization: Bearer $BACKEND_API_KEY\" \\${NC}"
echo -e "${BLUE}  -H \"Content-Type: application/json\" \\${NC}"
echo -e "${BLUE}  -d '{${NC}"
echo -e "${BLUE}    \"instance_id\": \"$INSTANCE_NAME\",${NC}"
echo -e "${BLUE}    \"to\": \"+56912345678\",${NC}"
echo -e "${BLUE}    \"message\": \"Hello from WhatsApp!\"${NC}"
echo -e "${BLUE}  }'${NC}"
echo ""
echo -e "${YELLOW}📱 Or directly with Evolution API:${NC}"
echo ""
echo -e "${BLUE}curl -X POST $EVOLUTION_API_URL/message/sendText/$INSTANCE_NAME \\${NC}"
echo -e "${BLUE}  -H \"apikey: $EVOLUTION_API_KEY\" \\${NC}"
echo -e "${BLUE}  -H \"Content-Type: application/json\" \\${NC}"
echo -e "${BLUE}  -d '{${NC}"
echo -e "${BLUE}    \"number\": \"56912345678\",${NC}"
echo -e "${BLUE}    \"textMessage\": {${NC}"
echo -e "${BLUE}      \"text\": \"Hello from WhatsApp!\"${NC}"
echo -e "${BLUE}    }${NC}"
echo -e "${BLUE}  }'${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"