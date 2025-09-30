# WhatsApp Infrastructure API

**Base URL:** `https://your-platform.com/api/v1`

Plataforma SaaS que permite a developers integrar WhatsApp fácilmente en sus aplicaciones sin configurar Evolution API.

## 🔐 Autenticación

Todas las requests requieren un API key válido en el header:

```bash
Authorization: Bearer pk_live_your_api_key_here
```

## 📱 Endpoints Principales

### **1. Crear Instancia WhatsApp**

```http
POST /api/v1/instances
```

**Request:**
```json
{
  "name": "mi-app-pagos",
  "webhook_url": "https://mi-app.com/webhooks/whatsapp"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "inst_abc123",
    "name": "mi-app-pagos",
    "status": "waiting_qr",
    "created_at": "2024-01-15T10:30:00Z",
    "webhook_url": "https://mi-app.com/webhooks/whatsapp"
  }
}
```

### **2. Obtener QR Code**

```http
GET /api/v1/instances/{instance_id}/qr
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "status": "waiting_qr",
    "expires_in": 60
  }
}
```

### **3. Enviar Mensaje**

```http
POST /api/v1/messages/send
```

**Request:**
```json
{
  "instance_id": "inst_abc123",
  "to": "+1234567890",
  "message": "¡Tu pago fue procesado exitosamente! ✅"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "msg_xyz789",
    "status": "sent",
    "timestamp": 1705316400000,
    "instance_id": "inst_abc123",
    "to": "+1234567890"
  }
}
```

### **4. Envío Masivo**

```http
POST /api/v1/messages/bulk
```

**Request:**
```json
{
  "instance_id": "inst_abc123",
  "messages": [
    {
      "to": "+1234567890",
      "message": "Mensaje para cliente 1"
    },
    {
      "to": "+0987654321",
      "message": "Mensaje para cliente 2"
    }
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

## 🚀 Ejemplos de Integración

### **JavaScript/Node.js**

```javascript
const apiKey = 'pk_live_your_key_here';
const baseUrl = 'https://your-platform.com/api/v1';

// Crear instancia
const instance = await fetch(`${baseUrl}/instances`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'mi-app-ecommerce',
    webhook_url: 'https://mi-app.com/webhooks'
  })
});

const { data } = await instance.json();
console.log('Instancia creada:', data.id);

// Enviar mensaje
const message = await fetch(`${baseUrl}/messages/send`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    instance_id: data.id,
    to: '+1234567890',
    message: '¡Gracias por tu compra! 🛒'
  })
});
```

### **Python**

```python
import requests

api_key = 'pk_live_your_key_here'
base_url = 'https://your-platform.com/api/v1'

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# Crear instancia
response = requests.post(f'{base_url}/instances',
    headers=headers,
    json={
        'name': 'mi-app-fintech',
        'webhook_url': 'https://mi-app.com/webhooks'
    }
)

instance = response.json()['data']

# Enviar mensaje
requests.post(f'{base_url}/messages/send',
    headers=headers,
    json={
        'instance_id': instance['id'],
        'to': '+1234567890',
        'message': 'Tu transferencia fue exitosa 💸'
    }
)
```

### **cURL**

```bash
# Crear instancia
curl -X POST https://your-platform.com/api/v1/instances \
  -H "Authorization: Bearer pk_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"name": "mi-app", "webhook_url": "https://mi-app.com/webhooks"}'

# Enviar mensaje
curl -X POST https://your-platform.com/api/v1/messages/send \
  -H "Authorization: Bearer pk_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "instance_id": "inst_abc123",
    "to": "+1234567890",
    "message": "¡Hola desde mi app!"
  }'
```

## 📊 Rate Limits

- **60 requests por minuto** por API key
- **1000 requests por hora** por API key
- **100 mensajes máximo** por bulk request

Headers de respuesta:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705316460
```

## ⚡ Casos de Uso

### **E-commerce**
```javascript
// Confirmación de compra
await sendMessage(customer.phone,
  `¡Gracias ${customer.name}! Tu pedido #${order.id} fue confirmado.
   Total: $${order.total}
   Entrega estimada: ${order.deliveryDate} 📦`
);
```

### **Fintech**
```javascript
// Notificación de transferencia
await sendMessage(user.phone,
  `💰 Transferencia exitosa
   Monto: $${transfer.amount}
   Destinatario: ${transfer.recipient}
   Ref: ${transfer.id}`
);
```

### **Healthcare**
```javascript
// Recordatorio de cita
await sendMessage(patient.phone,
  `🏥 Recordatorio: Tienes cita mañana ${appointment.date}
   a las ${appointment.time} con Dr. ${appointment.doctor}
   Responde CONFIRMAR para confirmar`
);
```

## 🔗 Webhooks

Tu app puede recibir eventos de WhatsApp configurando un webhook:

```json
{
  "event": "message_received",
  "instance_id": "inst_abc123",
  "from": "+1234567890",
  "message": "Hola, necesito ayuda",
  "timestamp": 1705316400000
}
```

## 📈 Próximas Funcionalidades

- ✅ Mensajes de texto
- 🔄 Mensajes con imágenes/documentos
- 🔄 Plantillas de mensajes
- 🔄 Bot framework integrado
- 🔄 Analytics y métricas
- 🔄 Webhooks bidireccionales

---

**¿Necesitas ayuda?** Contacta a: support@your-platform.com