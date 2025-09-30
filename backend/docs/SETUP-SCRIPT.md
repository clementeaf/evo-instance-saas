# Setup WhatsApp Script Guide

Complete guide for `setup-whatsapp-direct.sh` - the automated script to configure new WhatsApp instances.

---

## 📋 Overview

The `setup-whatsapp-direct.sh` script automates the entire process of:
- Creating a WhatsApp instance in Evolution API
- Generating and displaying QR code
- Waiting for WhatsApp connection
- Sending a test message
- Providing ready-to-use commands

**Time to setup:** ~2 minutes (including QR scan)

---

## 🚀 Quick Start

```bash
./scripts/setup-whatsapp-direct.sh "my-business" "+1234567890"
```

That's it! The script handles everything automatically.

---

## 📖 Usage

### **Syntax**

```bash
./scripts/setup-whatsapp-direct.sh [instance-name] [test-phone]
```

### **Parameters**

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `instance-name` | No | Name for the WhatsApp instance | `"my-restaurant"` |
| `test-phone` | No | Phone number for test message | `"+1234567890"` |

**Notes:**
- If `instance-name` is omitted, auto-generates name with timestamp
- If `test-phone` is omitted, skips sending test message
- Phone numbers must be in international format with `+` prefix

---

## 📝 Examples

### **Example 1: Full Setup with Test Message**

```bash
./scripts/setup-whatsapp-direct.sh "pizza-delivery" "+56959263366"
```

**Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 WhatsApp Instance Setup (Direct)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Instance Name: pizza-delivery
Test Phone: +56959263366

[1/5] Creating WhatsApp instance in Evolution API...
✅ Instance created: pizza-delivery

[2/5] Generating QR Code...
✅ QR Code saved: qr_pizza-delivery.png

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 SCAN THIS QR WITH YOUR PHONE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Open WhatsApp on your phone
2. Go to Settings → Linked Devices
3. Tap 'Link a Device'
4. Scan the QR code that opened

[3/5] Waiting for WhatsApp connection...
⏳ Status: connecting ... (attempt 5/30)
✅ WhatsApp connected successfully!

[4/5] Sending test message to +56959263366...
✅ Test message sent successfully!
   Message ID: msg_abc123xyz

[5/5] Setup complete!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SUCCESS! Your WhatsApp is ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Instance Details:
   Instance Name: pizza-delivery
   Status:        connected

🚀 Send messages using Backend API:
[... ready-to-use commands ...]
```

---

### **Example 2: Setup Without Test Message**

```bash
./scripts/setup-whatsapp-direct.sh "my-store"
```

Skips step [4/5] - no test message sent.

---

### **Example 3: Auto-Generated Name**

```bash
./scripts/setup-whatsapp-direct.sh
```

Creates instance with name like: `whatsapp-1727654321`

---

## 🔧 How It Works

### **Step-by-Step Process**

#### **Step 1: Create Instance**
```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: evolution-api-key-2024" \
  -d '{
    "instanceName": "pizza-delivery",
    "webhook": "http://host.docker.internal:8200/webhooks/wa",
    "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE", ...]
  }'
```

**What happens:**
- Creates instance in Evolution API
- Configures webhook to backend
- Subscribes to WhatsApp events

**Possible outcomes:**
- ✅ Success: Instance created
- ⚠️ Warning: Instance already exists (script continues anyway)
- ❌ Error: Evolution API not running

---

#### **Step 2: Generate QR Code**
```bash
curl -X GET http://localhost:8080/instance/connect/pizza-delivery \
  -H "apikey: evolution-api-key-2024"
```

**What happens:**
- Requests QR code from Evolution API
- Decodes base64 image
- Saves as PNG file (`qr_pizza-delivery.png`)
- Opens image automatically (macOS/Linux)

**QR Code lifespan:** ~60 seconds

---

#### **Step 3: Wait for Connection**
```bash
# Polls every 2 seconds for up to 60 seconds
curl -X GET http://localhost:8080/instance/connectionState/pizza-delivery \
  -H "apikey: evolution-api-key-2024"
```

**Connection states:**
- `connecting` → Waiting for scan
- `open` → Successfully connected ✅
- `close` → Disconnected or timeout ❌

**Timeout:** 30 attempts × 2 seconds = 60 seconds max

---

#### **Step 4: Send Test Message** (Optional)
```bash
curl -X POST http://localhost:8200/api/v1/messages/send \
  -H "Authorization: Bearer pk_live_test" \
  -d '{
    "instance_id": "pizza-delivery",
    "to": "+56959263366",
    "message": "🎉 WhatsApp conectado exitosamente!..."
  }'
```

**What happens:**
- Sends message via Backend API (not Evolution API directly)
- Tests full integration stack
- Confirms everything works end-to-end

---

#### **Step 5: Show Summary**

Displays:
- Instance details
- cURL command examples (Backend API)
- cURL command examples (Evolution API direct)
- Success confirmation

---

## 🎯 Use Cases

### **Use Case 1: Development Testing**
```bash
# Quick test with your own number
./scripts/setup-whatsapp-direct.sh "test-$(date +%s)" "+56959263366"
```

**Best for:** Quick testing, experimentation

---

### **Use Case 2: Client Onboarding**
```bash
# Setup for new client
./scripts/setup-whatsapp-direct.sh "client-restaurant-001" "+1234567890"
```

**Best for:** Production onboarding, real clients

---

### **Use Case 3: Multiple Instances**
```bash
# Setup multiple numbers
./scripts/setup-whatsapp-direct.sh "support-team"
./scripts/setup-whatsapp-direct.sh "sales-team"
./scripts/setup-whatsapp-direct.sh "billing-team"
```

**Best for:** Departments, teams, multi-number setup

---

## ⚠️ Common Issues & Solutions

### **Issue 1: QR Code Expired**

**Symptom:**
```
❌ Timeout waiting for connection
```

**Solution:**
```bash
# Simply run the script again
./scripts/setup-whatsapp-direct.sh "my-instance" "+1234567890"
```

QR codes expire after ~60 seconds. Just re-run to get a fresh QR.

---

### **Issue 2: Evolution API Not Running**

**Symptom:**
```
❌ Failed to create instance
curl: (7) Failed to connect to localhost port 8080
```

**Solution:**
```bash
# Start Evolution API
docker-compose up -d

# Wait 10 seconds for startup
sleep 10

# Try again
./scripts/setup-whatsapp-direct.sh "my-instance"
```

---

### **Issue 3: Backend Not Running**

**Symptom:**
```
❌ Failed to send test message
curl: (7) Failed to connect to localhost port 8200
```

**Solution:**
```bash
# Start backend in another terminal
npm run dev

# Script will work on next run
```

**Note:** Test message failure doesn't affect instance creation. Instance is still usable.

---

### **Issue 4: Instance Name Already Exists**

**Symptom:**
```
⚠️ Instance 'my-instance' already exists, using it...
```

**Solution:**
This is NOT an error! The script detects existing instances and reuses them. You'll just get a new QR code for the existing instance.

To force a fresh instance:
```bash
./scripts/setup-whatsapp-direct.sh "my-instance-v2"
```

---

### **Issue 5: Phone Already Connected to Another Instance**

**Symptom:**
WhatsApp shows error when scanning QR: "This phone is already linked"

**Solution:**
1. Open WhatsApp on phone
2. Go to Settings → Linked Devices
3. Remove old device
4. Run script again and scan new QR

---

## 🔐 Security Considerations

### **API Keys in Script**

The script uses hardcoded API keys:
```bash
EVOLUTION_API_KEY="evolution-api-key-2024"
BACKEND_API_KEY="pk_live_test"
```

**For Development:** This is fine
**For Production:** Replace with environment variables

```bash
# Production-safe version
export EVOLUTION_API_KEY="your-production-key"
export BACKEND_API_KEY="your-production-key"

./scripts/setup-whatsapp-direct.sh "client-001"
```

---

### **Webhook Configuration**

Default webhook:
```
http://host.docker.internal:8200/webhooks/wa
```

**Development:** Works for local Docker
**Production:** Change to public HTTPS URL

Edit script line 33:
```bash
"webhook": "https://your-domain.com/webhooks/wa"
```

---

## 📊 Script Output Files

### **QR Code Images**

**Location:** `./qr_[instance-name].png`

**Example:**
```
qr_pizza-delivery.png
qr_my-store.png
qr_client-001.png
```

**Cleanup:**
```bash
# Remove all QR code files
rm -f qr_*.png
```

---

## 🔄 Advanced Usage

### **Batch Setup Multiple Instances**

```bash
#!/bin/bash

# setup-multiple.sh
instances=(
  "support-team:+1111111111"
  "sales-team:+2222222222"
  "billing-team:+3333333333"
)

for entry in "${instances[@]}"; do
  IFS=':' read -r name phone <<< "$entry"
  echo "Setting up $name..."
  ./scripts/setup-whatsapp-direct.sh "$name" "$phone"
  echo "---"
  sleep 5
done
```

Usage:
```bash
chmod +x setup-multiple.sh
./setup-multiple.sh
```

---

### **Custom Webhook URL**

```bash
# Edit script before running
vim scripts/setup-whatsapp-direct.sh

# Change line 33:
"webhook": "https://my-custom-domain.com/webhooks/wa"
```

---

### **Silent Mode (No QR Display)**

```bash
# Remove/comment line 57-59 in script
# if command -v open &> /dev/null; then
#   open "$QR_FILE"
# fi
```

Useful for server environments where you can't display images.

---

## 🧪 Testing

### **Dry Run Test**

Test script logic without actually creating instances:

```bash
# Add this at the beginning of the script (after line 15)
echo "DRY RUN MODE - No actual API calls"
exit 0
```

---

### **Verify Instance Created**

```bash
# After running script
curl -H "apikey: evolution-api-key-2024" \
  http://localhost:8080/instance/fetchInstances \
  | jq '.[] | select(.instance.instanceName=="pizza-delivery")'
```

---

## 📚 Related Documentation

- [README.md](../README.md) - Main documentation
- [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) - API reference
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment

---

## 🆘 Getting Help

If you encounter issues:

1. Check [Troubleshooting](#common-issues--solutions) section above
2. Review Evolution API logs: `npm run evolution:logs`
3. Check backend logs in terminal
4. Open an issue on GitHub with script output

---

## 📝 Script Maintenance

### **Update Evolution API Version**

Edit `docker-compose.yml`:
```yaml
image: atendai/evolution-api:v1.7.5  # Update version
```

Restart:
```bash
npm run evolution:down
npm run evolution:up
```

---

### **Modify Test Message**

Edit script lines 104-106:
```bash
"message": "🎉 Your custom test message here!"
```

---

**Script Version:** 1.0.0
**Last Updated:** 2025-09-30
**Compatibility:** Evolution API v1.7.4+