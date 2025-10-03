#!/bin/bash

# Test script for send message endpoint
# Usage: ./test-send-message.sh

echo "🧪 Testing /api/v1/messages/send endpoint"
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:8200}"
API_KEY="${TEST_API_KEY:-your-api-key-here}"
INSTANCE_ID="${TEST_INSTANCE_ID:-inst_xxx}"
PHONE_NUMBER="${TEST_PHONE:-+5491112345678}"

echo "📋 Configuration:"
echo "  API URL: $API_URL"
echo "  Instance ID: $INSTANCE_ID"
echo "  Phone: $PHONE_NUMBER"
echo ""

# Test 1: Missing fields
echo "Test 1: Missing required fields"
curl -X POST "$API_URL/api/v1/messages/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{}'
echo -e "\n"

# Test 2: Invalid phone number
echo "Test 2: Invalid phone number"
curl -X POST "$API_URL/api/v1/messages/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"instance_id\": \"$INSTANCE_ID\",
    \"to\": \"invalid-phone\",
    \"message\": \"Test message\"
  }"
echo -e "\n"

# Test 3: Valid request
echo "Test 3: Valid message send request"
curl -X POST "$API_URL/api/v1/messages/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"instance_id\": \"$INSTANCE_ID\",
    \"to\": \"$PHONE_NUMBER\",
    \"message\": \"Test message from Evolution API at $(date)\"
  }"
echo -e "\n"

echo ""
echo "✅ Tests completed"
echo ""
echo "💡 To use this script:"
echo "  1. Set environment variables:"
echo "     export TEST_API_KEY='your-api-key'"
echo "     export TEST_INSTANCE_ID='inst_xxx'"
echo "     export TEST_PHONE='+5491112345678'"
echo "  2. Run: ./test-send-message.sh"
