import serverless from 'serverless-http';
import express from 'express';
import bodyParser from 'body-parser';
import { config } from './config';
import webhookRouter from './router/webhook';
import webhooksRouter from './router/webhooks';
import apiRouter from './router/api';

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Id, X-Instance-Id');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// API Routes
app.use('/api/v1', apiRouter);

// Webhook Routes (new evolution webhooks)
app.use('/api/v1/webhooks', webhooksRouter);

// Legacy webhook route
app.use('/webhooks', webhookRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export Lambda handler
export const handler = serverless(app);
