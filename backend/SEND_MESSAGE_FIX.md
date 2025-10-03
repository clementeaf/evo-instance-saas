# 🔧 Fix: Send Message Endpoint

## Problema Identificado

El endpoint `/api/v1/messages/send` estaba fallando porque:

1. **Error de mapeo de IDs**: El endpoint recibía `instance_id` (ID interno como `inst_xxx`) pero intentaba enviarlo directamente al Evolution API
2. **Evolution API necesita**: El `evolutionInstanceName` (como `tenant123_abc123`) no el ID interno
3. **Sin validación de estado**: No se verificaba si la instancia estaba conectada antes de enviar

## Cambios Realizados

### 1. `backend/src/router/api/messages.ts`

**Antes:**
```typescript
// ❌ Enviaba el instance_id directamente a Evolution API
const result = await messagingProvider.sendMessage(
  messageRequest.instance_id,  // Incorrecto: "inst_xxx"
  messageRequest.to,
  messageRequest.message
);
```

**Después:**
```typescript
// ✅ Obtiene la instancia de la DB primero
const instance = await instanceService.getInstance(messageRequest.instance_id, tenantId);

// ✅ Valida que exista y esté conectada
if (!instance) {
  return res.status(404).json({ error: 'Instance not found' });
}

if (instance.status !== 'connected') {
  return res.status(400).json({
    error: 'Instance not connected',
    message: `Instance is ${instance.status}. It must be connected to send messages.`
  });
}

// ✅ Usa el evolutionInstanceName correcto
const result = await messagingProvider.sendMessage(
  instance.evolutionInstanceName,  // Correcto: "tenant123_abc123"
  messageRequest.to,
  messageRequest.message
);
```

**Validaciones agregadas:**
- ✅ Verifica que la instancia exista y pertenezca al tenant
- ✅ Valida que la instancia esté en estado `connected`
- ✅ Retorna errores descriptivos

### 2. `backend/src/services/messaging/evolution.provider.ts`

**Mejoras en logging y error handling:**

```typescript
// ✅ Log exitoso más descriptivo
console.log(`✅ Evolution API: Message sent to ${to} via ${instanceId}`);

// ✅ Error logging detallado
console.error(`❌ Evolution API Error (${instanceId}):`, {
  status: axiosError.response?.status,
  statusText: axiosError.response?.statusText,
  data: axiosError.response?.data,
  message: axiosError.message
});

// ✅ Mensaje de error más informativo
error: `Evolution API Error (${status}): ${JSON.stringify(errorDetails)}`
```

### 3. Script de Testing

Creado `backend/test-send-message.sh` para facilitar pruebas:

```bash
# Configurar variables
export TEST_API_KEY='your-api-key'
export TEST_INSTANCE_ID='inst_xxx'
export TEST_PHONE='+5491112345678'

# Ejecutar tests
./test-send-message.sh
```

## Flujo Correcto Ahora

```
1. Request llega con instance_id (inst_xxx)
   ↓
2. Router obtiene la instancia de DynamoDB
   ↓
3. Valida que exista y pertenezca al tenant
   ↓
4. Valida que esté en estado "connected"
   ↓
5. Extrae evolutionInstanceName (tenant123_abc123)
   ↓
6. Llama a Evolution API con el nombre correcto
   ↓
7. Retorna resultado al cliente
```

## Mapeo de IDs

| Campo | Valor Ejemplo | Uso |
|-------|---------------|-----|
| **id** | `inst_abc123xyz` | ID interno (DynamoDB, respuestas API) |
| **evolutionInstanceName** | `tenant123_def456` | ID en Evolution API (envío de mensajes) |
| **tenantId** | `test-tenant` | Identificador del tenant |
| **name** | `"Mi WhatsApp"` | Nombre amigable del usuario |

## Errores Comunes y Soluciones

### Error: "Instance not found"
**Causa:** El `instance_id` no existe o no pertenece al tenant
**Solución:** Verificar que el ID sea correcto y que el tenant tenga acceso

### Error: "Instance not connected"
**Causa:** La instancia existe pero no está conectada a WhatsApp
**Solución:**
1. Obtener el QR code: `GET /api/v1/instances/{id}/qr`
2. Escanear con WhatsApp
3. Esperar que el estado cambie a `connected`

### Error: "Evolution API Error (404)"
**Causa:** El `evolutionInstanceName` no existe en Evolution API
**Solución:** Verificar que la instancia se creó correctamente en Evolution API

### Error: "Evolution API Error (401)"
**Causa:** API key de Evolution API incorrecta
**Solución:** Verificar `EVOLUTION_API_API_KEY` en `.env`

### Error: "Invalid phone number"
**Causa:** Formato de número de teléfono incorrecto
**Solución:** Usar formato internacional con código de país: `+5491112345678`

## Testing

### 1. Test Manual con curl

```bash
# Enviar mensaje
curl -X POST "http://localhost:8200/api/v1/messages/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "instance_id": "inst_abc123",
    "to": "+5491112345678",
    "message": "Hola desde Evolution API!"
  }'
```

### 2. Verificar Logs

En el servidor deberías ver:

**Éxito:**
```
✅ Evolution API: Message sent to +5491112345678 via tenant123_def456
✅ Message sent via evolution: msg_xyz789 to +5491112345678
```

**Error:**
```
❌ Evolution API Error (tenant123_def456): {
  status: 404,
  statusText: 'Not Found',
  data: { error: 'Instance not found' }
}
```

### 3. Verificar en Frontend

Si estás usando el frontend, los errores ahora son más descriptivos:

```json
{
  "success": false,
  "error": "Instance not connected",
  "message": "Instance is waiting_qr. It must be connected to send messages."
}
```

## Próximos Pasos (Opcional)

### 1. Agregar Retry Logic
```typescript
// Reintentar en caso de error temporal
for (let i = 0; i < 3; i++) {
  try {
    return await messagingProvider.sendMessage(...);
  } catch (error) {
    if (i === 2) throw error;
    await sleep(1000 * (i + 1)); // Backoff exponencial
  }
}
```

### 2. Queue de Mensajes
Para evitar pérdida de mensajes:
- Guardar en SQS antes de enviar
- Procesar de forma asíncrona
- Reintentar automáticamente en caso de error

### 3. Webhook de Estado
Evolution API envía webhooks cuando:
- Mensaje enviado
- Mensaje entregado
- Mensaje leído

Actualizar el estado del mensaje en tu DB.

## Resumen

✅ **Problema resuelto**: El endpoint ahora mapea correctamente los IDs
✅ **Validaciones agregadas**: Verifica existencia y estado de la instancia
✅ **Mejor logging**: Errores más descriptivos para debugging
✅ **Tests creados**: Script para facilitar pruebas

**El endpoint `/api/v1/messages/send` ahora funciona correctamente.** 🎉
