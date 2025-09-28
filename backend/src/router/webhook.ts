import { Router, Request, Response } from 'express';
import { SQSService } from '../services/sqs';
import { SecurityService } from '../services/security';

const router = Router();

router.post('/wa', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const payload = JSON.stringify(req.body);

    console.log('📞 Received webhook from Evolution API:', {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      bodySize: payload.length,
    });

    if (!SecurityService.validateHMAC(payload, signature)) {
      console.error('❌ Invalid HMAC signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('✅ HMAC validation passed');

    const webhookData = {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      body: req.body,
      source: 'evolution-api',
    };

    await SQSService.sendMessage(webhookData);

    console.log('📨 Webhook event queued successfully');

    return res.status(200).json({
      success: true,
      message: 'Webhook received and queued',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/wa', (req: Request, res: Response) => {
  res.json({
    message: 'Evolution API Webhook endpoint is ready',
    method: 'POST',
    endpoint: '/webhooks/wa',
    timestamp: new Date().toISOString()
  });
});

export default router;