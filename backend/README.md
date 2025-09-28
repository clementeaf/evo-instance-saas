# Backend - Evo Instance SaaS

Backend API para sistema SaaS multi-tenant con integración Evolution API.

## Stack Tecnológico

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **Base de Datos**: DynamoDB (AWS o local)
- **Mensajería**: Amazon SQS
- **WhatsApp**: Evolution API
- **Autenticación**: HMAC validation

## Configuración Rápida

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 3. Iniciar DynamoDB Local
```bash
docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb
node create-tables-local.js
```

### 4. Iniciar Servidor
```bash
npm run dev
```

## Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Compilar TypeScript
- `npm run start` - Servidor de producción
- `npm run worker` - Worker para procesar mensajes
- `npm run test` - Ejecutar tests
- `npm run db:bootstrap` - Crear tablas DynamoDB
- `npm run create:instance` - Crear instancia WhatsApp

## Arquitectura

### Flujo de Mensajes
1. WhatsApp → Evolution API → Webhook → SQS
2. Worker procesa SQS → Bot System → DynamoDB
3. Bot responde → Evolution API → WhatsApp

### Estructura de Carpetas
```
src/
├── bots/           # Sistema de bots
├── config/         # Configuración
├── models/         # Tipos TypeScript
├── router/         # Rutas HTTP
├── scripts/        # Scripts utilitarios
├── services/       # Servicios (DynamoDB, SQS, etc.)
└── worker/         # Worker de mensajes
```

## Configuración Detallada

### Evolution API
Seguir guía en `setup-evolution.sh` para configuración completa.

### Variables de Entorno Principales
```bash
# Server
PORT=8200

# Evolution API
EVOLUTION_API_BASE_URL=http://localhost:8080
EVOLUTION_API_TOKEN=tu-token

# Webhook
PUBLIC_WEBHOOK_URL=https://tu-ngrok.ngrok.io
WA_WEBHOOK_SECRET=tu-secret

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
DYNAMO_ENDPOINT=http://localhost:8000  # Para local

# Bot Configuration
INSTANCE_NAME=wa-mvp
DEFAULT_BOT=menu-basic
TENANT_ID=mvp
EVOLUTION_DRY_RUN=true  # Para testing
```

## Testing

### Tests Unitarios
```bash
npm test
```

### Tests de Integración
```bash
# Test completo de bots
node test-complete-flow.js

# Test de DynamoDB
node test-dynamodb.js

# Test de reservas
node test-reservations.js
```

## Deployment

### Docker
Ver `docker-compose.evolution.yml` para Evolution API con PostgreSQL.

### AWS
1. Configurar DynamoDB tables
2. Configurar SQS queue
3. Configurar S3 bucket
4. Deploy en EC2/ECS/Lambda

## Arquitectura de Bots

### Sistema FSM (Finite State Machine)
Cada conversación mantiene estado:
- `botKey`: Bot activo
- `fsm`: Estado actual
- `data`: Datos de sesión

### Bots Disponibles
- **MenuBot**: Menú principal
- **ReservationsBasicBot**: Sistema de reservas

### Crear Nuevo Bot
1. Extender `BaseBot`
2. Implementar `handleMessage(ctx)`
3. Registrar en `BotRegistry`

## Troubleshooting

### DynamoDB Local
```bash
# Verificar que esté corriendo
curl http://localhost:8000

# Recrear tablas
node create-tables-local.js
```

### Evolution API
```bash
# Verificar estado
curl http://localhost:8080/instance/connectionState/wa-mvp

# Ver logs
docker logs evolution_api
```

### Debug
```bash
# Ver logs del worker
npm run worker

# Test webhook
curl -X POST http://localhost:8200/webhooks/wa \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```