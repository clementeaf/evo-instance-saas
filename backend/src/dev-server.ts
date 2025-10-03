import express from 'express';
import { createServer } from 'http';
import { WebSocketService } from './services/websocket';
import apiRouter from './router/api/instances';
import messagesRouter from './router/api/messages';
import webhooksRouter from './router/webhooks';

const app = express();
const httpServer = createServer(app);
const wsService = WebSocketService.getInstance();

// Initialize WebSocket
wsService.initialize(httpServer);

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Id, X-Instance-Id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Routes
app.use('/api/v1/instances', apiRouter);
app.use('/api/v1/messages', messagesRouter);
app.use('/api/v1/webhooks', webhooksRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', websocket: 'enabled' });
});

const PORT = process.env.PORT || 8200;

httpServer.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ WebSocket enabled`);
});
