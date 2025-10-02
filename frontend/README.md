# Frontend - WhatsApp Instance Manager

Frontend minimalista en blanco y negro para gestionar instancias de WhatsApp.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias (si no están)
npm install

# Iniciar en desarrollo
npm run dev
```

Abre http://localhost:5173

## 🎯 Funcionalidades

1. **Crear Instancia** - Crea una nueva instancia de WhatsApp
2. **Mostrar QR** - Genera y muestra el código QR para conectar
3. **Auto-polling** - Detecta automáticamente cuando se escanea el QR
4. **Enviar Mensaje** - Envía mensaje de prueba cuando está conectado

## 📝 Configuración

Variables en `.env`:
```
VITE_API_URL=https://7t026jebb9.execute-api.us-east-1.amazonaws.com
VITE_API_KEY=pk_live_test
```

## 🏗️ Estructura

```
src/
├── api/
│   └── client.ts          # Cliente HTTP para el backend
├── components/
│   ├── CreateInstance.tsx # Crear instancia
│   ├── ShowQR.tsx         # Mostrar QR + polling
│   └── SendMessage.tsx    # Enviar mensaje
├── types.ts               # TypeScript types
└── App.tsx                # Componente principal
```

## 🎨 Diseño

- **Blanco y negro** - Sin colores, solo funcionalidad
- **Monospace** - Font monoespaciada
- **Sin CSS frameworks** - Inline styles minimalistas
- **Mobile-friendly** - Responsive básico

## 📦 Build

```bash
npm run build
```

Output en `dist/`

## 🚢 Deploy

### Vercel (Recomendado - GRATIS)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### GitHub Pages
```bash
npm run build
# Sube la carpeta dist/ a gh-pages branch
```

## 🔗 Endpoints Usados

- `POST /api/v1/instances` - Crear instancia
- `GET /api/v1/instances` - Listar instancias
- `GET /api/v1/instances/:id` - Obtener instancia
- `GET /api/v1/instances/:id/qr` - Obtener QR code
- `POST /api/v1/messages/send` - Enviar mensaje

## ⚡ Stack

- React 18
- TypeScript
- Vite
- Axios
- @tanstack/react-query (para data fetching)

---

**Backend:** https://7t026jebb9.execute-api.us-east-1.amazonaws.com
**Evolution API:** https://evolution-api-saas.fly.dev
