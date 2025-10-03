# Configuración de ngrok para Webhooks

## ¿Por qué necesitas ngrok?

Evolution API necesita enviar webhooks a tu backend cuando ocurren eventos (QR code, conexión, mensajes). Como tu backend está en `localhost:8200`, Evolution API no puede accederlo desde internet.

**ngrok crea un túnel HTTPS público que apunta a tu localhost.**

---

## Instalación de ngrok

### Opción 1: Homebrew (Mac)
```bash
brew install ngrok
```

### Opción 2: Descarga directa
1. Ve a https://ngrok.com/download
2. Descarga para macOS
3. Descomprime y mueve a `/usr/local/bin`

```bash
unzip ~/Downloads/ngrok-*.zip
sudo mv ngrok /usr/local/bin/
```

### Verificar instalación
```bash
ngrok version
```

---

## Configuración

### 1. Crear cuenta en ngrok (gratis)
1. Ve a https://dashboard.ngrok.com/signup
2. Crea una cuenta
3. Copia tu **authtoken**

### 2. Autenticar ngrok
```bash
ngrok config add-authtoken TU_TOKEN_AQUI
```

---

## Usar ngrok con tu backend

### 1. Iniciar tunnel
```bash
# En una terminal separada
ngrok http 8200
```

Verás algo como:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:8200
```

### 2. Copiar la URL de ngrok
Copia la URL `https://abc123.ngrok.io` (será diferente cada vez)

### 3. Configurar en .env
```bash
# backend/.env
PUBLIC_WEBHOOK_URL=https://abc123.ngrok.io
```

---

## Flujo completo de desarrollo

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

### Terminal 2: ngrok
```bash
ngrok http 8200
```

### Terminal 3: Frontend
```bash
cd frontend
npm run dev
```

---

## Verificar que funciona

### 1. Verificar túnel activo
```bash
curl https://TU-URL.ngrok.io/health
```

Deberías ver:
```json
{"status":"ok","websocket":"enabled"}
```

### 2. Verificar webhook endpoint
```bash
curl https://TU-URL.ngrok.io/api/v1/webhooks/health
```

Deberías ver:
```json
{
  "status":"ok",
  "message":"Webhook endpoint is ready",
  "endpoint":"/api/v1/webhooks/receive"
}
```

---

## Configurar Evolution API para usar tu webhook

Cuando creas una instancia, Evolution API ya está configurado para enviar webhooks a:
```
https://TU-URL.ngrok.io/api/v1/webhooks/receive
```

Esto se configura automáticamente en `backend/src/services/instances.ts`:
```typescript
const webhookConfig = webhookUrl || `${config.server.publicUrl}/api/v1/webhooks/receive`;
```

---

## Webhooks que recibirás

Evolution API enviará eventos POST a `/api/v1/webhooks/receive`:

### CONNECTION_UPDATE
Cuando la instancia se conecta/desconecta
```json
{
  "event": "CONNECTION_UPDATE",
  "data": {
    "state": "open"  // o "close"
  }
}
```

### QRCODE_UPDATED
Cuando se genera un nuevo QR
```json
{
  "event": "QRCODE_UPDATED",
  "data": {
    "qrcode": {
      "base64": "data:image/png;base64,..."
    }
  }
}
```

### MESSAGES_UPSERT
Cuando se recibe un mensaje
```json
{
  "event": "MESSAGES_UPSERT",
  "data": {
    "messages": [...]
  }
}
```

---

## Monitorear webhooks en tiempo real

### Opción 1: Logs del backend
El backend ya registra todos los webhooks:
```
📞 Webhook received: { event: 'CONNECTION_UPDATE', ... }
```

### Opción 2: Dashboard de ngrok
Ve a http://localhost:4040 mientras ngrok está corriendo para ver todas las requests HTTP en tiempo real.

---

## Troubleshooting

### ngrok se desconecta cada 2 horas
**Plan gratuito de ngrok:** La URL cambia cada vez que reinicias ngrok.

**Solución temporal:** Actualiza `PUBLIC_WEBHOOK_URL` en .env cuando cambies la URL.

**Solución permanente:** Upgrade a ngrok Pro ($8/mes) para URL fija.

### Webhook no llega al backend
1. Verifica que ngrok esté corriendo: `curl https://TU-URL.ngrok.io/health`
2. Revisa logs de ngrok en http://localhost:4040
3. Verifica que Evolution API tenga la URL correcta

### Evolution API no envía webhooks
1. Verifica que la instancia se creó con webhook configurado
2. Revisa logs de Evolution API
3. Verifica que Evolution API pueda alcanzar tu ngrok URL

---

## Alternativas a ngrok (opcional)

### LocalTunnel
```bash
npm install -g localtunnel
lt --port 8200
```

### Cloudflare Tunnel
```bash
brew install cloudflare/cloudflare/cloudflared
cloudflared tunnel --url http://localhost:8200
```

### Serveo
```bash
ssh -R 80:localhost:8200 serveo.net
```

---

## Para producción

En producción **NO usas ngrok**. Despliegas tu backend en:
- AWS App Runner
- Vercel
- Railway
- Render
- Heroku

Y usas la URL pública directamente:
```
https://tu-app.railway.app/api/v1/webhooks/receive
```

---

## Siguiente paso

1. **Instala ngrok**: `brew install ngrok`
2. **Inicia ngrok**: `ngrok http 8200`
3. **Actualiza .env**: Agrega la URL de ngrok
4. **Reinicia backend**: Para que lea la nueva URL
5. **Crea una instancia**: Los webhooks deberían funcionar automáticamente
