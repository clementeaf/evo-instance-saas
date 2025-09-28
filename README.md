# Evo Instance SaaS

SaaS multi-tenant con integración Evolution API para automatización de WhatsApp.

## Estructura del Proyecto

```
evo-instance-saas/
├── backend/                 # Backend API (Node.js + TypeScript)
│   ├── src/                # Código fuente
│   ├── dist/               # Código compilado
│   ├── tests/              # Tests
│   ├── package.json        # Dependencias backend
│   └── .env                # Variables de entorno
└── frontend/               # Frontend (próximamente)
```

## Backend

El backend es una API REST construida con:
- **Node.js + Express + TypeScript**
- **DynamoDB** (AWS o local)
- **SQS** (AWS) para mensajería
- **Evolution API** para WhatsApp

### Funcionalidades
- ✅ Sistema de bots conversacionales
- ✅ Gestión de reservas con slots temporales
- ✅ Multi-tenant
- ✅ Webhook de WhatsApp
- ✅ Estado conversacional (FSM)

### Iniciar Backend

```bash
cd backend
npm install
npm run dev
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Tests
npm test

# Worker (procesar mensajes)
npm run worker

# Configurar DynamoDB
npm run db:bootstrap

# Crear instancia WhatsApp
npm run create:instance
```

## Configuración Completa

Ver `backend/README.md` para configuración detallada de Evolution API y AWS.

## Estado Actual

- ✅ **Backend**: 100% funcional
- ⏳ **Frontend**: Pendiente
- ⏳ **Deployment**: Pendiente

## Próximos Pasos

1. Crear frontend (React/Next.js)
2. Panel de administración
3. Dashboard de métricas
4. Deployment en AWS