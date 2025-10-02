# 🚀 Deployment Guide - AWS Serverless

## ✅ Lo que hemos configurado

- **Serverless Framework** con auto-creación de recursos AWS
- **DynamoDB** con creación automática de tablas si no existen
- **Lambda + API Gateway** para el backend
- **SQS** para procesamiento de webhooks
- **IAM Roles** automáticos con permisos correctos

---

## 📋 Pre-requisitos

1. **AWS CLI configurado** ✅ (ya está)
   - Account: `041238861016`
   - Region: `us-east-1`

2. **Serverless Framework instalado** ✅ (ya está)

3. **Evolution API desplegado** ⏳ (siguiente paso)
   - Opciones: Railway, Fly.io, o EC2

---

## 🔐 Paso 1: Configurar Variables de Entorno

Edita `.env.production` con tus valores reales:

```bash
# Evolution API (deploy esto primero en Railway/Fly.io)
EVOLUTION_API_BASE_URL=https://tu-evolution-api.railway.app
EVOLUTION_API_TOKEN=tu-token-seguro-aqui

# Webhook secret (genera uno seguro)
WA_WEBHOOK_SECRET=$(openssl rand -hex 32)

# OpenAI (opcional)
OPENAI_API_KEY=sk-tu-api-key
```

---

## 🚀 Paso 2: Deploy a AWS

```bash
# Deploy a dev (recomendado primero)
npm run deploy:dev

# O deploy a production
npm run deploy:prod
```

Esto creará automáticamente:
- ✅ 5 tablas DynamoDB (instances, api_keys, slots, bookings, conversation_states)
- ✅ 1 SQS queue para webhooks
- ✅ Lambda function con tu API
- ✅ API Gateway HTTP endpoint
- ✅ IAM roles con permisos correctos

---

## 📊 Después del Deploy

Serverless te mostrará:

```
✔ Service deployed to stack evo-instance-saas-dev

endpoints:
  ANY - https://abc123xyz.execute-api.us-east-1.amazonaws.com/{proxy+}

functions:
  api: evo-instance-saas-dev-api
  webhookWorker: evo-instance-saas-dev-webhookWorker
```

**Copia la URL del endpoint** y actualiza:

1. `.env.production`:
   ```bash
   PUBLIC_WEBHOOK_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com
   ```

2. Evolution API webhook config (cuando lo deploys)

---

## 🧪 Paso 3: Probar Endpoints

```bash
# Health check
curl https://tu-api-gateway-url.amazonaws.com/health

# Crear instancia (necesitas API key válido)
curl -X POST https://tu-api-gateway-url.amazonaws.com/api/v1/instances \
  -H "Authorization: Bearer pk_live_test" \
  -H "Content-Type: application/json" \
  -d '{"name": "test-instance"}'
```

---

## 📝 Comandos Útiles

```bash
# Ver logs en tiempo real
npm run sls:logs

# Deploy solo una función
serverless deploy function -f api

# Ver información del stack
serverless info

# Remover todo de AWS
npm run sls:remove
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module..."
```bash
npm run build
npm run deploy
```

### Error: "Access Denied"
Verifica IAM permissions en AWS Console

### Tablas no se crean automáticamente
Las tablas se crean en el primer uso. Si falla, verifica los logs:
```bash
serverless logs -f api --tail
```

---

## 💰 Costos Estimados

**Con AWS Free Tier:**
- Lambda: GRATIS (1M requests/mes)
- API Gateway: GRATIS (1M requests/mes)
- DynamoDB: GRATIS (25GB storage, 25 write/read units)
- SQS: GRATIS (1M requests/mes)

**Después del Free Tier:**
- ~$5-15/mes para bajo tráfico
- ~$30-50/mes para tráfico medio

---

## 🎯 Próximos Pasos

1. ✅ Deploy backend a AWS (esto)
2. ⏳ Deploy Evolution API a Railway
3. ⏳ Crear frontend
4. ⏳ Configurar dominio custom (opcional)
5. ⏳ Setup monitoring (CloudWatch/Sentry)

---

## 🔗 Enlaces Útiles

- [Serverless Dashboard](https://app.serverless.com)
- [AWS Console - Lambda](https://console.aws.amazon.com/lambda)
- [AWS Console - DynamoDB](https://console.aws.amazon.com/dynamodb)
- [AWS Console - API Gateway](https://console.aws.amazon.com/apigateway)
