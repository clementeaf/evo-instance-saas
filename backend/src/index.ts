
import express from 'express';
import bodyParser from 'body-parser';
import { config } from './config';
import webhookRouter from './router/webhook';

const app = express();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/webhooks', webhookRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(config.server.port, () => {
  console.log(`🚀 Evolution API SaaS running on port ${config.server.port}`);
  console.log(`📱 Webhook endpoint: http://localhost:${config.server.port}/webhooks/wa`);
  console.log(`🏥 Health check: http://localhost:${config.server.port}/health`);
});