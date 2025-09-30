#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:8200/api/v1"
API_KEY="pk_live_test"

# Arguments
INSTANCE_NAME=${1:-"whatsapp-$(date +%s)"}
TEST_PHONE=${2:-""}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 WhatsApp Instance Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Instance Name:${NC} $INSTANCE_NAME"
if [ ! -z "$TEST_PHONE" ]; then
  echo -e "${YELLOW}Test Phone:${NC} $TEST_PHONE"
fi
echo ""

# Step 1: Create Instance
echo -e "${BLUE}[1/5]${NC} Creating WhatsApp instance..."
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/instances" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$INSTANCE_NAME\"
  }")

INSTANCE_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id // empty')

if [ -z "$INSTANCE_ID" ]; then
  echo -e "${RED}❌ Failed to create instance${NC}"
  echo $CREATE_RESPONSE | jq
  exit 1
fi

echo -e "${GREEN}✅ Instance created: $INSTANCE_ID${NC}"
echo ""

# Step 2: Get QR Code
echo -e "${BLUE}[2/5]${NC} Generating QR Code..."
sleep 2

QR_RESPONSE=$(curl -s -X GET "$API_BASE_URL/instances/$INSTANCE_ID/qr" \
  -H "Authorization: Bearer $API_KEY")

QR_CODE=$(echo $QR_RESPONSE | jq -r '.data.qr_code // empty')

if [ -z "$QR_CODE" ]; then
  echo -e "${YELLOW}⏳ QR not ready yet, retrying...${NC}"
  sleep 3
  QR_RESPONSE=$(curl -s -X GET "$API_BASE_URL/instances/$INSTANCE_ID/qr" \
    -H "Authorization: Bearer $API_KEY")
  QR_CODE=$(echo $QR_RESPONSE | jq -r '.data.qr_code // empty')
fi

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
  STATUS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/instances/$INSTANCE_ID" \
    -H "Authorization: Bearer $API_KEY")

  STATUS=$(echo $STATUS_RESPONSE | jq -r '.data.status')

  if [ "$STATUS" = "connected" ]; then
    echo -e "${GREEN}✅ WhatsApp connected successfully!${NC}"
    break
  fi

  echo -ne "${YELLOW}⏳ Status: $STATUS ... (attempt $((ATTEMPT+1))/$MAX_ATTEMPTS)\r${NC}"
  sleep 2
  ATTEMPT=$((ATTEMPT+1))
done

if [ "$STATUS" != "connected" ]; then
  echo -e "\n${RED}❌ Timeout waiting for connection${NC}"
  echo -e "${YELLOW}💡 Please try again or check if QR code expired${NC}"
  exit 1
fi

echo ""
echo ""

# Step 4: Send Test Message (if phone provided)
if [ ! -z "$TEST_PHONE" ]; then
  echo -e "${BLUE}[4/5]${NC} Sending test message to $TEST_PHONE..."

  SEND_RESPONSE=$(curl -s -X POST "$API_BASE_URL/messages/send" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"instance_id\": \"$INSTANCE_ID\",
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
echo "   Instance ID:   $INSTANCE_ID"
echo "   Instance Name: $INSTANCE_NAME"
echo "   Status:        connected"
echo ""
echo -e "${YELLOW}🚀 Send messages using:${NC}"
echo ""
echo -e "${BLUE}curl -X POST $API_BASE_URL/messages/send \\${NC}"
echo -e "${BLUE}  -H \"Authorization: Bearer $API_KEY\" \\${NC}"
echo -e "${BLUE}  -H \"Content-Type: application/json\" \\${NC}"
echo -e "${BLUE}  -d '{${NC}"
echo -e "${BLUE}    \"instance_id\": \"$INSTANCE_ID\",${NC}"
echo -e "${BLUE}    \"to\": \"+56912345678\",${NC}"
echo -e "${BLUE}    \"message\": \"Hello from WhatsApp!\"${NC}"
echo -e "${BLUE}  }'${NC}"
echo ""
echo -e "${YELLOW}📱 Or use Node.js:${NC}"
echo ""
echo -e "${BLUE}const axios = require('axios');${NC}"
echo -e "${BLUE}await axios.post('$API_BASE_URL/messages/send', {${NC}"
echo -e "${BLUE}  instance_id: '$INSTANCE_ID',${NC}"
echo -e "${BLUE}  to: '+56912345678',${NC}"
echo -e "${BLUE}  message: 'Hello!'${NC}"
echo -e "${BLUE}}, {${NC}"
echo -e "${BLUE}  headers: { 'Authorization': 'Bearer $API_KEY' }${NC}"
echo -e "${BLUE}});${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"