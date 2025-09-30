import { Router } from 'express';
import messagesRouter from './messages';
import instancesRouter from './instances';

const router = Router();

// API Routes
router.use('/messages', messagesRouter);
router.use('/instances', instancesRouter);

// API Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Info
router.get('/', (req, res) => {
  res.json({
    name: 'WhatsApp Infrastructure API',
    version: '1.0.0',
    description: 'REST API for WhatsApp messaging integration',
    documentation: 'https://docs.your-platform.com/api',
    endpoints: {
      messages: '/api/v1/messages',
      instances: '/api/v1/instances',
      health: '/api/v1/health'
    }
  });
});

export default router;