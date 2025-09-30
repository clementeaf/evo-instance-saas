# WhatsApp SaaS Platform 🚀

A complete multi-tenant SaaS platform for WhatsApp Business automation, built with Node.js, TypeScript, and Evolution API.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-5.2.2-blue)

---

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Bot System](#bot-system)
- [Scripts](#scripts)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Core Capabilities
- ✅ **Multi-Tenant Architecture** - Isolated instances per client
- ✅ **REST API** - Send messages, manage instances
- ✅ **WhatsApp Integration** - Evolution API v1.7.4
- ✅ **Authentication** - API key-based with permissions
- ✅ **Rate Limiting** - Per-tenant configurable limits
- ✅ **Webhooks** - Real-time event processing
- ✅ **Bot Framework** - Conversational AI with FSM

### Messaging Features
- 📱 Send text messages to any number
- 📤 Bulk messaging (up to 100 messages)
- 🔄 Real-time delivery status (via webhooks)
- 🤖 AI-powered responses (OpenAI integration)
- 💬 Conversational bots with state management

### Developer Experience
- 🚀 One-command setup for new WhatsApp numbers
- 📖 Complete API documentation
- 🔧 Development mode with hot reload
- 🐳 Docker Compose for Evolution API
- 📝 TypeScript for type safety

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│              (E-commerce, CRM, Custom Apps)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS + Bearer Token
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (Port 8200)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth/Rate    │  │   Message    │  │  Instance    │      │
│  │ Limiting     │  │   Router     │  │  Manager     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Bot Runtime  │  │  Webhook     │  │   Worker     │      │
│  │ (FSM)        │  │  Handler     │  │   (SQS)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Evolution API (Port 8080)                       │
│                  WhatsApp Web Protocol                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
              WhatsApp Servers
```

### Tech Stack

**Backend:**
- Node.js 18+
- TypeScript 5.2
- Express.js
- ts-node-dev (hot reload)

**WhatsApp:**
- Evolution API v1.7.4
- Docker & Docker Compose

**Storage (Optional):**
- AWS DynamoDB (instances, API keys, messages)
- AWS SQS (webhook queue)
- AWS S3 (media storage)

**AI:**
- OpenAI GPT-3.5/4 (conversational bots)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker & Docker Compose
- (Optional) AWS account for production

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd evo-instance-saas/backend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your settings (see Configuration section)

# 4. Start Evolution API
docker-compose up -d

# 5. Start backend
npm run dev
```

### Setup Your First WhatsApp Number

```bash
# Run the automated setup script
./scripts/setup-whatsapp-direct.sh "my-business" "+1234567890"
```

This will:
1. Create a WhatsApp instance
2. Generate and display QR code
3. Wait for you to scan with your phone
4. Send a test message
5. Show you example commands

### Send Your First Message

```bash
curl -X POST http://localhost:8200/api/v1/messages/send \
  -H "Authorization: Bearer pk_live_test" \
  -H "Content-Type: application/json" \
  -d '{
    "instance_id": "my-business",
    "to": "+1234567890",
    "message": "Hello from my SaaS!"
  }'
```

---

## 📚 API Documentation

### Base URL
```
Development: http://localhost:8200/api/v1
Production:  https://your-domain.com/api/v1
```

### Authentication

All endpoints require an API key in the Authorization header:

```bash
Authorization: Bearer pk_live_your_api_key_here
```

**Development Bypass:** In development mode, you can use `pk_live_test` which has full permissions.

---

### Endpoints

#### **Send Message**

```http
POST /api/v1/messages/send
```

**Request:**
```json
{
  "instance_id": "my-business",
  "to": "+1234567890",
  "message": "Hello! This is a test message."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "msg_abc123xyz",
    "status": "sent",
    "timestamp": 1709193982139,
    "instance_id": "my-business",
    "to": "+1234567890"
  }
}
```

---

#### **Send Bulk Messages**

```http
POST /api/v1/messages/bulk
```

**Request:**
```json
{
  "instance_id": "my-business",
  "messages": [
    {"to": "+1111111111", "message": "Message 1"},
    {"to": "+2222222222", "message": "Message 2"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 2,
    "sent": 2,
    "failed": 0,
    "results": [...]
  }
}
```

**Limits:** Maximum 100 messages per request

---

#### **Create Instance**

```http
POST /api/v1/instances
```

**Request:**
```json
{
  "name": "client-restaurant",
  "webhook_url": "https://your-app.com/webhooks/whatsapp"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "inst_abc123",
    "name": "client-restaurant",
    "status": "waiting_qr",
    "created_at": "2025-09-30T00:00:00Z",
    "webhook_url": "https://your-app.com/webhooks/whatsapp"
  }
}
```

**Note:** Currently requires DynamoDB. For development, use `setup-whatsapp-direct.sh` script instead.

---

#### **Get QR Code**

```http
GET /api/v1/instances/{instance_id}/qr
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qr_code": "data:image/png;base64,iVBORw0KGgo...",
    "status": "waiting_qr",
    "expires_in": 60
  }
}
```

---

#### **List Instances**

```http
GET /api/v1/instances
```

**Response:**
```json
{
  "success": true,
  "data": {
    "instances": [
      {
        "id": "inst_abc123",
        "name": "my-business",
        "status": "connected",
        "created_at": "2025-09-30T00:00:00Z"
      }
    ],
    "total": 1
  }
}
```

---

#### **Get Instance Details**

```http
GET /api/v1/instances/{instance_id}
```

---

#### **Delete Instance**

```http
DELETE /api/v1/instances/{instance_id}
```

---

### Rate Limits

Default limits per API key:
- **60 requests per minute**
- **1000 requests per hour**

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1709193982
```

---

## 🤖 Bot System

The platform includes a powerful bot framework with Finite State Machines (FSM) for conversational flows.

### Available Bots

#### 1. **MenuBot** (`menu-basic`)
Main menu with options for different services.

```
User receives:
👋 Bienvenido
1) Reservar una cita
2) Consultar/confirmar pago
3) Asistente IA 🤖
4) Hablar con un agente
```

#### 2. **ReservationsBasicBot** (`reservations-basic`)
Booking system with step-by-step flow.

**States:** WELCOME → GET_NAME → GET_DATE → GET_TIME → CONFIRMED

#### 3. **SimpleAI** (`simple-ai`)
AI-powered assistant using OpenAI.

**Features:**
- Natural language understanding
- Context-aware responses
- Configurable personality via system prompts

---

### Activating Bots

Bots are triggered via webhooks when messages are received.

**To enable bot responses:**

1. Start the worker process:
```bash
npm run worker
```

2. Ensure webhooks are configured in Evolution API

3. Send a message to your WhatsApp number

4. The bot will automatically respond based on the conversation state

---

### Creating Custom Bots

See `src/bots/` for examples. Basic structure:

```typescript
export class MyCustomBot {
  static key = "my-custom-bot";

  static async handleMessage(ctx: BotContext) {
    const userMessage = ctx.text;

    // Your bot logic here
    await ctx.sendText(ctx.from, "Bot response");

    // Update state if needed
    await ctx.setState({
      botKey: "my-custom-bot",
      fsm: "NEXT_STATE",
      data: { customField: "value" }
    });
  }
}
```

Register in `src/bots/registry.ts`:
```typescript
export const BotRegistry = {
  get(key: string) {
    if (key === MyCustomBot.key) return MyCustomBot;
    // ... other bots
  }
};
```

---

## 🛠️ Scripts

### Available Commands

```bash
# Development
npm run dev              # Start backend with hot reload

# WhatsApp Setup
npm run setup-whatsapp           # Interactive setup (requires DynamoDB)
npm run send-message             # Send test message

# New! Direct Evolution API setup (no DynamoDB required)
./scripts/setup-whatsapp-direct.sh "instance-name" "+1234567890"

# Evolution API Management
npm run evolution:up     # Start Evolution API
npm run evolution:down   # Stop Evolution API
npm run evolution:logs   # View Evolution API logs

# Production
npm run build            # Compile TypeScript
npm run start            # Start compiled app

# Worker
npm run worker           # Start webhook worker (for bots)

# Database (if using DynamoDB locally)
npm run db:bootstrap     # Create DynamoDB tables
```

---

### Setup WhatsApp Instance Script

**Usage:**
```bash
./scripts/setup-whatsapp-direct.sh [instance-name] [test-phone]
```

**Examples:**

```bash
# Basic setup (auto-generated name)
./scripts/setup-whatsapp-direct.sh

# With custom name
./scripts/setup-whatsapp-direct.sh "my-restaurant"

# With test message
./scripts/setup-whatsapp-direct.sh "my-store" "+1234567890"
```

**What it does:**
1. ✅ Creates instance in Evolution API
2. ✅ Generates QR code and opens it automatically
3. ✅ Waits for connection (up to 60 seconds)
4. ✅ Sends test message (if phone number provided)
5. ✅ Displays ready-to-use API commands

---

## ⚙️ Configuration

### Environment Variables

See [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md) for complete reference.

**Essential Variables:**

```env
# Server
PORT=8200
NODE_ENV=development
PUBLIC_WEBHOOK_URL=http://localhost:8200

# Evolution API
EVOLUTION_API_BASE_URL=http://localhost:8080
EVOLUTION_API_TOKEN=evolution-api-key-2024

# Features
EVOLUTION_DRY_RUN=false          # Set to true to simulate sending

# OpenAI (for AI bot)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo

# AWS (optional, for production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# DynamoDB (optional)
DYNAMODB_TABLE_PREFIX=evo-saas
DYNAMO_ENDPOINT=http://localhost:8000  # For local DynamoDB

# SQS (optional)
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/...

# Webhook Security
WA_WEBHOOK_SECRET=your-webhook-secret-here
```

### Docker Compose Configuration

The `docker-compose.yml` file configures Evolution API:

```yaml
services:
  evolution-api:
    image: atendai/evolution-api:v1.7.4
    ports:
      - "8080:8080"
    environment:
      AUTHENTICATION_API_KEY: 'evolution-api-key-2024'
      WEBHOOK_GLOBAL_URL: 'http://host.docker.internal:8200/webhooks/wa'
      # ... more config
```

**Key settings:**
- `DATABASE_ENABLED: false` - No persistence (for development)
- `STORE_MESSAGES: false` - Don't store message history
- `WEBHOOK_GLOBAL_URL` - Where to send events

---

## 🚢 Deployment

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed guides.

### Quick Deploy Options

#### **Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### **AWS (App Runner + RDS)**
1. Build Docker image
2. Push to ECR
3. Create App Runner service
4. Configure RDS for Evolution API persistence

#### **Vercel (Serverless)**
- Backend API can be deployed as serverless functions
- Evolution API needs separate hosting (Railway, Fly.io)

---

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure real DynamoDB tables
- [ ] Set up RDS/PostgreSQL for Evolution API
- [ ] Enable HTTPS (SSL certificates)
- [ ] Configure production API keys
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Enable webhook signature validation
- [ ] Configure rate limiting with Redis
- [ ] Set up log aggregation

---

## 🐛 Troubleshooting

### Common Issues

#### **WhatsApp Not Connecting**

```bash
# Check Evolution API logs
npm run evolution:logs

# Restart Evolution API
npm run evolution:down
npm run evolution:up

# Generate new QR code
./scripts/setup-whatsapp-direct.sh "my-instance"
```

#### **Messages Not Sending**

1. Check if instance is connected:
```bash
curl -H "apikey: evolution-api-key-2024" \
  http://localhost:8080/instance/connectionState/my-instance
```

2. Verify `EVOLUTION_DRY_RUN=false` in `.env`

3. Check backend logs for errors

#### **Backend Not Starting**

```bash
# Kill any process on port 8200
lsof -ti:8200 | xargs kill -9

# Restart backend
npm run dev
```

#### **DynamoDB Connection Errors**

If you see `ECONNREFUSED ::1:8000`:
- Either start local DynamoDB, or
- Use `setup-whatsapp-direct.sh` script which bypasses DynamoDB

#### **Rate Limit Exceeded**

Wait for the rate limit window to reset (typically 60 seconds), or increase limits in your API key configuration.

---

## 📖 Additional Documentation

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Full API reference with examples
- [README-SIMPLE.md](./README-SIMPLE.md) - Quick start guide
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Production deployment (coming soon)
- [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md) - Environment variables reference (coming soon)
- [docs/BOTS.md](./docs/BOTS.md) - Bot development guide (coming soon)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture (coming soon)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details

---

## 🆘 Support

- **Documentation:** Check the `/docs` folder
- **Issues:** Open an issue on GitHub
- **Email:** support@your-platform.com

---

## 🎉 Success Stories

This platform powers:
- 🍕 Restaurant booking systems
- 🏥 Healthcare appointment reminders
- 💰 Fintech payment notifications
- 🛒 E-commerce order confirmations
- 📚 Educational course updates

**Ready to build your WhatsApp integration?** Start with the [Quick Start](#quick-start) guide above!