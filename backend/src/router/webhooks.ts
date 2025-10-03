import { Router, Request, Response } from 'express';
import { WebSocketService } from '../services/websocket';
import { WebSocketAWSService } from '../services/websocket-aws';
import { InstanceService } from '../services/instances';

const router = Router();
const wsService = WebSocketService.getInstance(); // For local dev
const wsAWSService = WebSocketAWSService.getInstance(); // For production
const instanceService = new InstanceService();

/**
 * Webhook endpoint for Evolution API events
 * Evolution API sends events like:
 * - CONNECTION_UPDATE: When instance connects/disconnects
 * - QRCODE_UPDATED: When QR code is generated
 * - MESSAGES_UPSERT: When message is received/sent
 */
router.post('/receive', async (req: Request, res: Response) => {
  try {
    const event = req.body;

    // Extract evolution instance name from event
    const evolutionInstanceName = event.instance || event.instanceName || event.data?.instance?.instanceName;

    if (!evolutionInstanceName) {
      console.log('⚠️ Webhook received without instance name:', event);
      return res.status(200).json({ success: false, error: 'No instance name' });
    }

    // Find our instance by evolution instance name
    const instances = await instanceService.getInstances('mvp'); // Default tenant for now
    const instance = instances.find(i => i.evolutionInstanceName === evolutionInstanceName);

    if (!instance) {
      console.log(`⚠️ Instance not found: ${evolutionInstanceName}`);
      return res.status(200).json({ success: false, error: 'Instance not found' });
    }

    const tenantId = instance.tenantId;
    const instanceId = instance.id;

    console.log('📞 Webhook received:', {
      event: event.event,
      evolutionInstanceName,
      tenantId,
      instanceId,
      timestamp: new Date().toISOString()
    });

    // Handle different event types (normalize event names)
    const eventType = event.event.toUpperCase().replace(/\./g, '_');

    switch (eventType) {
      case 'CONNECTION_UPDATE':
        await handleConnectionUpdate(event, tenantId, instanceId);
        break;

      case 'QRCODE_UPDATED':
        await handleQRCodeUpdate(event, tenantId, instanceId);
        break;

      case 'MESSAGES_UPSERT':
        console.log('📨 Message received:', event.data);
        // Handle incoming messages if needed
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.event}`);
    }

    // Always respond 200 to Evolution API
    res.status(200).json({
      success: true,
      message: 'Webhook processed',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);
    // Still return 200 to prevent retries
    res.status(200).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Handle connection status updates
 */
async function handleConnectionUpdate(event: any, tenantId: string, instanceId: string) {
  const state = event.data?.state || event.data?.instance?.state;

  console.log('🔄 Connection update:', {
    instanceId,
    state,
    data: event.data
  });

  let status: 'connected' | 'disconnected' | 'error' = 'disconnected';

  if (state === 'open') {
    status = 'connected';
  } else if (state === 'close' || state === 'connecting') {
    status = 'disconnected';
  }

  // Update instance status in database
  try {
    await instanceService.updateInstanceStatus(instanceId, status);

    // Emit via WebSocket to all connected clients (both local and AWS)
    wsService.emitConnectionStatus(tenantId, instanceId, status);
    await wsAWSService.emitConnectionStatus(tenantId, instanceId, status);

    console.log(`✅ Instance ${instanceId} status updated to: ${status}`);
  } catch (error) {
    console.error('Error updating instance status:', error);
  }
}

/**
 * Handle QR code updates
 */
async function handleQRCodeUpdate(event: any, tenantId: string, instanceId: string) {
  const qrCode = event.data?.qrcode?.base64 || event.data?.base64;

  console.log('📱 QR code update:', {
    instanceId,
    hasQR: !!qrCode
  });

  if (qrCode) {
    // Emit QR code via WebSocket (both local and AWS)
    wsService.emitQRReady(tenantId, instanceId, qrCode);
    await wsAWSService.emitQRReady(tenantId, instanceId, qrCode);
    console.log(`✅ QR code emitted for instance: ${instanceId}`);
  }
}

/**
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Webhook endpoint is ready',
    endpoint: '/api/v1/webhooks/receive',
    timestamp: new Date().toISOString()
  });
});

export default router;
