# Environment Variables Reference

Complete reference for all environment variables used in the WhatsApp SaaS platform.

---

## 📋 Quick Reference

```env
# Copy this to your .env file and customize values
# See detailed descriptions below

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=8200
NODE_ENV=development
PUBLIC_WEBHOOK_URL=http://localhost:8200

# ============================================
# EVOLUTION API
# ============================================
EVOLUTION_API_BASE_URL=http://localhost:8080
EVOLUTION_API_TOKEN=evolution-api-key-2024
EVOLUTION_DRY_RUN=false

# ============================================
# WEBHOOKS
# ============================================
WA_WEBHOOK_SECRET=your-webhook-secret-here

# ============================================
# AWS CONFIGURATION (Optional)
# ============================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# ============================================
# DYNAMODB (Optional)
# ============================================
DYNAMODB_TABLE_PREFIX=evo-saas
DYNAMO_TABLE_SLOTS=saas_slots
DYNAMO_TABLE_BOOKINGS=saas_bookings
DYNAMO_ENDPOINT=http://localhost:8000

# ============================================
# SQS (Optional)
# ============================================
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/your-queue

# ============================================
# S3 (Optional)
# ============================================
S3_BUCKET_NAME=your-s3-bucket-name

# ============================================
# OPENAI (For AI Bot)
# ============================================
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-3.5-turbo

# ============================================
# BOT/WORKER CONFIGURATION
# ============================================
INSTANCE_NAME=my-whatsapp
DEFAULT_BOT=menu-basic
TENANT_ID=mvp
SLOT_HOLD_MS=180000
```

---

## 📖 Detailed Documentation

### **Server Configuration**

#### `PORT`
- **Type:** Number
- **Default:** `3000`
- **Required:** No
- **Description:** Port where the backend API server runs
- **Examples:**
  - Development: `8200`
  - Production: `3000` or `8080`

```env
PORT=8200
```

---

#### `NODE_ENV`
- **Type:** String
- **Default:** `development`
- **Required:** No
- **Values:** `development` | `production` | `test`
- **Description:** Environment mode - affects logging, error handling, and API key validation
- **Impact:**
  - `development`: Verbose logging, `pk_live_test` bypass enabled
  - `production`: Minimal logging, strict validation
  - `test`: For automated testing

```env
NODE_ENV=production
```

---

#### `PUBLIC_WEBHOOK_URL`
- **Type:** URL
- **Default:** `http://localhost:{PORT}`
- **Required:** Yes (for production)
- **Description:** Public URL where webhooks will be received
- **Examples:**
  - Local: `http://localhost:8200`
  - ngrok: `https://abc123.ngrok.io`
  - Production: `https://api.yourdomain.com`

```env
PUBLIC_WEBHOOK_URL=https://api.yourdomain.com
```

**Important:** Must be HTTPS in production for webhook security.

---

### **Evolution API Configuration**

#### `EVOLUTION_API_BASE_URL`
- **Type:** URL
- **Default:** None
- **Required:** Yes
- **Description:** Base URL of your Evolution API instance
- **Examples:**
  - Local Docker: `http://localhost:8080`
  - Remote: `https://evolution-api.yourdomain.com`

```env
EVOLUTION_API_BASE_URL=http://localhost:8080
```

---

#### `EVOLUTION_API_TOKEN`
- **Type:** String
- **Default:** None
- **Required:** Yes
- **Description:** API key for authenticating with Evolution API
- **Note:** Must match `AUTHENTICATION_API_KEY` in Evolution API's docker-compose.yml

```env
EVOLUTION_API_TOKEN=evolution-api-key-2024
```

**Security Tip:** Use a strong, random key in production.

---

#### `EVOLUTION_DRY_RUN`
- **Type:** Boolean
- **Default:** `false`
- **Required:** No
- **Description:** When `true`, simulates sending messages without actually sending them
- **Use Cases:**
  - Testing message flows
  - Development without spamming real numbers
  - Debugging bot logic

```env
# Development
EVOLUTION_DRY_RUN=true

# Production
EVOLUTION_DRY_RUN=false
```

---

### **Webhook Configuration**

#### `WA_WEBHOOK_SECRET`
- **Type:** String
- **Default:** None
- **Required:** Yes (for production)
- **Description:** Secret key for HMAC validation of incoming webhooks
- **Purpose:** Ensures webhooks are genuinely from Evolution API

```env
WA_WEBHOOK_SECRET=your-random-secret-key-here
```

**Generate a secure secret:**
```bash
openssl rand -hex 32
```

---

### **AWS Configuration**

#### `AWS_REGION`
- **Type:** String
- **Default:** `us-east-1`
- **Required:** If using AWS services
- **Description:** AWS region for DynamoDB, SQS, S3
- **Common Values:**
  - `us-east-1` (N. Virginia)
  - `us-west-2` (Oregon)
  - `eu-west-1` (Ireland)
  - `ap-southeast-1` (Singapore)

```env
AWS_REGION=us-east-1
```

---

#### `AWS_ACCESS_KEY_ID`
- **Type:** String
- **Default:** None
- **Required:** If using AWS services
- **Description:** AWS IAM access key ID
- **Format:** `AKIA...` (20 characters)

```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
```

**Security:** Never commit to git. Use IAM roles in production.

---

#### `AWS_SECRET_ACCESS_KEY`
- **Type:** String
- **Default:** None
- **Required:** If using AWS services
- **Description:** AWS IAM secret access key
- **Format:** 40 characters

```env
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Security:** Never commit to git. Use IAM roles in production.

---

### **DynamoDB Configuration**

#### `DYNAMODB_TABLE_PREFIX`
- **Type:** String
- **Default:** `evo-saas`
- **Required:** No
- **Description:** Prefix for all DynamoDB table names
- **Resulting Tables:**
  - `{prefix}_instances`
  - `{prefix}_api_keys`
  - `{prefix}_messages`
  - `{prefix}_conversations`

```env
DYNAMODB_TABLE_PREFIX=mycompany-prod
```

---

#### `DYNAMO_ENDPOINT`
- **Type:** URL
- **Default:** None (uses AWS)
- **Required:** For local development
- **Description:** Custom DynamoDB endpoint for local testing

```env
# Local DynamoDB
DYNAMO_ENDPOINT=http://localhost:8000

# Production (omit this variable)
# DYNAMO_ENDPOINT=
```

---

#### `DYNAMO_TABLE_SLOTS`
- **Type:** String
- **Default:** `saas_slots`
- **Required:** No
- **Description:** Table name for reservation slots (used by ReservationsBot)

```env
DYNAMO_TABLE_SLOTS=saas_slots
```

---

#### `DYNAMO_TABLE_BOOKINGS`
- **Type:** String
- **Default:** `saas_bookings`
- **Required:** No
- **Description:** Table name for bookings (used by ReservationsBot)

```env
DYNAMO_TABLE_BOOKINGS=saas_bookings
```

---

### **SQS Configuration**

#### `SQS_QUEUE_URL`
- **Type:** URL
- **Default:** None
- **Required:** If using webhook worker
- **Description:** Full URL of SQS queue for webhook processing
- **Format:** `https://sqs.{region}.amazonaws.com/{account-id}/{queue-name}`

```env
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/whatsapp-webhooks
```

---

### **S3 Configuration**

#### `S3_BUCKET_NAME`
- **Type:** String
- **Default:** None
- **Required:** If storing media
- **Description:** S3 bucket for storing WhatsApp media (images, documents, audio)

```env
S3_BUCKET_NAME=mycompany-whatsapp-media
```

---

### **OpenAI Configuration**

#### `OPENAI_API_KEY`
- **Type:** String
- **Default:** None
- **Required:** If using SimpleAI bot
- **Description:** OpenAI API key for GPT integration
- **Format:** `sk-proj-...` or `sk-...`
- **Get Key:** https://platform.openai.com/api-keys

```env
OPENAI_API_KEY=sk-proj-abc123xyz789...
```

**Cost Note:** GPT-3.5-turbo is ~$0.002 per 1K tokens.

---

#### `OPENAI_MODEL`
- **Type:** String
- **Default:** `gpt-3.5-turbo`
- **Required:** No
- **Description:** OpenAI model to use
- **Options:**
  - `gpt-3.5-turbo` - Fast, cheap ($0.002/1K tokens)
  - `gpt-4` - More capable, expensive ($0.03/1K tokens)
  - `gpt-4-turbo` - Faster GPT-4

```env
OPENAI_MODEL=gpt-3.5-turbo
```

---

### **Bot/Worker Configuration**

#### `INSTANCE_NAME`
- **Type:** String
- **Default:** None
- **Required:** If using worker
- **Description:** Default WhatsApp instance name for bot worker

```env
INSTANCE_NAME=my-whatsapp
```

---

#### `DEFAULT_BOT`
- **Type:** String
- **Default:** `menu-basic`
- **Required:** No
- **Description:** Default bot to use for new conversations
- **Options:**
  - `menu-basic` - Main menu bot
  - `reservations-basic` - Reservations flow
  - `simple-ai` - AI assistant

```env
DEFAULT_BOT=menu-basic
```

---

#### `TENANT_ID`
- **Type:** String
- **Default:** None
- **Required:** If using worker
- **Description:** Tenant ID for multi-tenant setup

```env
TENANT_ID=mvp
```

---

#### `SLOT_HOLD_MS`
- **Type:** Number (milliseconds)
- **Default:** `180000` (3 minutes)
- **Required:** No
- **Description:** How long to hold a reservation slot before releasing it

```env
SLOT_HOLD_MS=300000  # 5 minutes
```

---

## 🔧 Environment-Specific Configurations

### **Development Setup**

```env
# .env.development
PORT=8200
NODE_ENV=development
PUBLIC_WEBHOOK_URL=http://localhost:8200

EVOLUTION_API_BASE_URL=http://localhost:8080
EVOLUTION_API_TOKEN=evolution-api-key-2024
EVOLUTION_DRY_RUN=true  # Don't send real messages

# No AWS credentials needed
# DYNAMO_ENDPOINT=http://localhost:8000  # If using local DynamoDB

OPENAI_API_KEY=sk-...  # Optional, for testing AI bot

INSTANCE_NAME=test-instance
DEFAULT_BOT=menu-basic
TENANT_ID=dev
```

---

### **Production Setup**

```env
# .env.production
PORT=3000
NODE_ENV=production
PUBLIC_WEBHOOK_URL=https://api.yourdomain.com

EVOLUTION_API_BASE_URL=https://evolution.yourdomain.com
EVOLUTION_API_TOKEN=prod-secure-key-here
EVOLUTION_DRY_RUN=false

WA_WEBHOOK_SECRET=prod-webhook-secret-here

# AWS Production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

DYNAMODB_TABLE_PREFIX=prod-whatsapp
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/.../prod-webhooks
S3_BUCKET_NAME=prod-whatsapp-media

OPENAI_API_KEY=sk-prod-...
OPENAI_MODEL=gpt-3.5-turbo

INSTANCE_NAME=prod-main
DEFAULT_BOT=menu-basic
TENANT_ID=production
```

---

### **Staging Setup**

```env
# .env.staging
PORT=8200
NODE_ENV=production
PUBLIC_WEBHOOK_URL=https://staging-api.yourdomain.com

EVOLUTION_API_BASE_URL=https://staging-evolution.yourdomain.com
EVOLUTION_API_TOKEN=staging-key-here
EVOLUTION_DRY_RUN=false

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

DYNAMODB_TABLE_PREFIX=staging-whatsapp
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/.../staging-webhooks

OPENAI_API_KEY=sk-staging-...

TENANT_ID=staging
```

---

## 🔐 Security Best Practices

### **1. Never Commit Secrets**

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
.env.production
```

---

### **2. Use Environment-Specific Files**

```bash
.env                    # Never commit
.env.example            # Commit (template with dummy values)
.env.development        # Optional, for dev defaults
.env.production         # Never commit
```

---

### **3. Rotate Keys Regularly**

```bash
# Generate new keys quarterly
EVOLUTION_API_TOKEN=$(openssl rand -hex 32)
WA_WEBHOOK_SECRET=$(openssl rand -hex 32)
```

---

### **4. Use IAM Roles in Production**

Instead of:
```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

Use EC2/ECS IAM roles (no keys needed).

---

### **5. Encrypt Sensitive Values**

For secrets management:
- AWS Secrets Manager
- HashiCorp Vault
- Kubernetes Secrets

---

## 🧪 Testing Configuration

### **Validate Environment**

```bash
# Check required variables
node -e "require('dotenv').config(); console.log(process.env.EVOLUTION_API_BASE_URL || 'MISSING')"
```

---

### **Test Configuration Script**

Create `scripts/validate-env.js`:
```javascript
require('dotenv').config();

const required = [
  'EVOLUTION_API_BASE_URL',
  'EVOLUTION_API_TOKEN',
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required env vars:', missing);
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

Run:
```bash
node scripts/validate-env.js
```

---

## 📚 Related Documentation

- [README.md](../README.md) - Main documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
- [SETUP-SCRIPT.md](./SETUP-SCRIPT.md) - Setup script guide

---

**Last Updated:** 2025-09-30