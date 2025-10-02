# 🔐 Production Deployment - Credentials & URLs

**GUARDA ESTE ARCHIVO EN UN LUGAR SEGURO - CONTIENE CREDENCIALES SENSIBLES**

---

## 🌐 **Evolution API (Fly.io)**

**URL:** `https://evolution-api-saas.fly.dev`

**API Key:** `evo-api-key-bc6f214bcbe8781c969b358011b996b1`

**PostgreSQL:**
- Host: `evo-pg-v1.flycast`
- User: `postgres`
- Password: `YWI8I2AbmFjJ4se`
- Database: `evolution_api_saas`
- Connection String: `postgres://evolution_api_saas:r0tMpajL7dOp1Lm@evo-pg-v1.flycast:5432/evolution_api_saas?sslmode=disable`

**Endpoints útiles:**
- Docs: https://evolution-api-saas.fly.dev/docs
- Manager: https://evolution-api-saas.fly.dev/manager
- Status: https://evolution-api-saas.fly.dev/

---

## ☁️ **Backend AWS (Lambda + API Gateway)**

**API Gateway URL:** `https://7t026jebb9.execute-api.us-east-1.amazonaws.com`

**Endpoints:**
- Health: `/health`
- API Info: `/api/v1/`
- Create Instance: `POST /api/v1/instances`
- List Instances: `GET /api/v1/instances`
- Get QR Code: `GET /api/v1/instances/:id/qr`
- Send Message: `POST /api/v1/messages/send`
- Bulk Messages: `POST /api/v1/messages/bulk`

**API Key para testing:**
- Development: `pk_live_test` (solo en dev mode)

**AWS Resources:**
- Stack: `evo-instance-saas-dev`
- Region: `us-east-1`
- Lambda Functions:
  - `evo-instance-saas-dev-api`
  - `evo-instance-saas-dev-webhookWorker`

**DynamoDB Tables:**
- `evo-instance-saas-dev-instances`
- `evo-instance-saas-dev-api-keys`
- `evo-instance-saas-dev-slots`
- `evo-instance-saas-dev-bookings`
- `evo-instance-saas-dev-conversation-states`

**SQS Queue:**
- `evo-instance-saas-dev-webhooks`

---

## 💰 **Costos Mensuales Estimados**

### Evolution API (Fly.io)
- **Compute (512MB RAM):** $0-3/mes (free tier o ~$3)
- **PostgreSQL (1GB):** GRATIS (incluido en free tier)
- **Total Fly.io:** ~$0-3/mes

### Backend AWS
- **Lambda:** GRATIS (dentro de free tier 1M requests)
- **API Gateway:** GRATIS (dentro de free tier 1M requests)
- **DynamoDB:** GRATIS (dentro de free tier 25GB)
- **SQS:** GRATIS (dentro de free tier 1M requests)
- **Total AWS:** $0/mes (con free tier)

### **TOTAL ESTIMADO: $0-3/mes** 🎉

---

## 🧪 **Cómo Probar**

### 1. Verificar Evolution API
```bash
curl https://evolution-api-saas.fly.dev/
```

### 2. Verificar Backend AWS
```bash
curl https://7t026jebb9.execute-api.us-east-1.amazonaws.com/health
```

### 3. Crear Instancia WhatsApp
```bash
curl -X POST https://7t026jebb9.execute-api.us-east-1.amazonaws.com/api/v1/instances \
  -H "Authorization: Bearer pk_live_test" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-first-instance"}'
```

### 4. Obtener QR Code
```bash
curl https://7t026jebb9.execute-api.us-east-1.amazonaws.com/api/v1/instances/INSTANCE_ID/qr \
  -H "Authorization: Bearer pk_live_test"
```

---

## 📝 **Comandos Útiles**

### Fly.io
```bash
# Ver logs
flyctl logs --app evolution-api-saas

# Ver status
flyctl status --app evolution-api-saas

# Restart app
flyctl apps restart evolution-api-saas

# Ver secrets
flyctl secrets list --app evolution-api-saas

# SSH a la máquina
flyctl ssh console --app evolution-api-saas

# Ver PostgreSQL
flyctl postgres connect --app evo-pg-v1
```

### AWS Serverless
```bash
# Ver logs
cd backend
npx serverless logs -f api --tail

# Redeploy
npm run deploy:dev

# Ver info del stack
npx serverless info

# Eliminar stack
npx serverless remove
```

---

## 🎯 **Próximos Pasos**

1. ✅ Evolution API desplegado
2. ✅ Backend AWS desplegado
3. ⏳ **Crear Frontend React**
4. ⏳ Probar flujo completo: crear instancia → QR → conectar celular → enviar mensaje
5. ⏳ Configurar dominio custom (opcional)
6. ⏳ Setup monitoring (Sentry/CloudWatch)

---

## ⚠️ **IMPORTANTE - SEGURIDAD**

- **NO COMMITEAR ESTE ARCHIVO A GIT**
- Rotar API keys regularmente
- Usar diferentes keys para dev/prod
- Habilitar logs de auditoría
- Configurar alertas de costos en AWS
- Hacer backups de PostgreSQL

---

## 📞 **Soporte**

- Evolution API Docs: https://doc.evolution-api.com
- Fly.io Docs: https://fly.io/docs
- AWS Lambda Docs: https://docs.aws.amazon.com/lambda
- Serverless Docs: https://www.serverless.com/framework/docs

---

**Fecha de Deploy:** 2025-10-01
**Deploy realizado por:** Claude Code
**Versión Evolution API:** v1.7.4
**Región AWS:** us-east-1
**Región Fly.io:** iad (Virginia)
