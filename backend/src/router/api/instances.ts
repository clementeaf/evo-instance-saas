import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth';
import { InstanceService } from '../../services/instances';

const router = Router();
const authMiddleware = new AuthMiddleware();
const instanceService = new InstanceService();

// Apply authentication to all routes
router.use(authMiddleware.authenticate);

// Create new WhatsApp instance
router.post('/', authMiddleware.requirePermission('instances:create'), async (req: Request, res: Response) => {
  try {
    const { name, webhook_url } = req.body;
    const tenantId = req.tenantId!;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid name',
        message: 'Instance name is required and must be a string'
      });
    }

    if (name.length < 3 || name.length > 50) {
      return res.status(400).json({
        error: 'Invalid name length',
        message: 'Instance name must be between 3 and 50 characters'
      });
    }

    // Validate webhook URL if provided
    if (webhook_url) {
      try {
        new URL(webhook_url);
      } catch {
        return res.status(400).json({
          error: 'Invalid webhook URL',
          message: 'Webhook URL must be a valid HTTPS URL'
        });
      }

      if (!webhook_url.startsWith('https://')) {
        return res.status(400).json({
          error: 'Invalid webhook URL',
          message: 'Webhook URL must use HTTPS'
        });
      }
    }

    const instance = await instanceService.createInstance(tenantId, name, webhook_url);

    res.status(201).json({
      success: true,
      data: {
        id: instance.id,
        name: instance.name,
        evolution_instance_name: instance.evolutionInstanceName,
        status: instance.status,
        created_at: new Date(instance.createdAt).toISOString(),
        webhook_url: instance.webhookUrl
      }
    });

  } catch (error: any) {
    console.error('Create instance error:', error);
    res.status(500).json({
      error: 'Failed to create instance',
      message: error.message
    });
  }
});

// Get instance details
router.get('/:instanceId', authMiddleware.requirePermission('instances:read'), async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;
    const tenantId = req.tenantId!;

    const instance = await instanceService.getInstance(instanceId, tenantId);

    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        message: 'The requested instance does not exist or you do not have access to it'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: instance.id,
        name: instance.name,
        evolution_instance_name: instance.evolutionInstanceName,
        status: instance.status,
        created_at: new Date(instance.createdAt).toISOString(),
        connected_at: instance.connectedAt ? new Date(instance.connectedAt).toISOString() : null,
        last_activity: instance.lastActivity ? new Date(instance.lastActivity).toISOString() : null,
        webhook_url: instance.webhookUrl
      }
    });

  } catch (error: any) {
    console.error('Get instance error:', error);
    res.status(500).json({
      error: 'Failed to get instance',
      message: error.message
    });
  }
});

// List all instances for tenant
router.get('/', authMiddleware.requirePermission('instances:read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const instances = await instanceService.getInstances(tenantId);

    const formattedInstances = instances.map(instance => ({
      id: instance.id,
      name: instance.name,
      evolution_instance_name: instance.evolutionInstanceName,
      status: instance.status,
      created_at: new Date(instance.createdAt).toISOString(),
      connected_at: instance.connectedAt ? new Date(instance.connectedAt).toISOString() : null,
      last_activity: instance.lastActivity ? new Date(instance.lastActivity).toISOString() : null
    }));

    res.status(200).json({
      success: true,
      data: {
        instances: formattedInstances,
        total: formattedInstances.length
      }
    });

  } catch (error: any) {
    console.error('List instances error:', error);
    res.status(500).json({
      error: 'Failed to list instances',
      message: error.message
    });
  }
});

// Get QR code for instance connection
router.get('/:instanceId/qr', authMiddleware.requirePermission('instances:read'), async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;
    const tenantId = req.tenantId!;

    const instance = await instanceService.getInstance(instanceId, tenantId);

    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found'
      });
    }

    if (instance.status === 'connected') {
      return res.status(400).json({
        error: 'Instance already connected',
        message: 'This WhatsApp instance is already connected'
      });
    }

    const qrCode = await instanceService.getQRCode(instanceId, tenantId);

    if (!qrCode) {
      return res.status(404).json({
        error: 'QR code not available',
        message: 'QR code is not yet available. Please try again in a few seconds'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        qr_code: qrCode,
        status: instance.status,
        expires_in: 60 // QR codes typically expire in 60 seconds
      }
    });

  } catch (error: any) {
    console.error('Get QR code error:', error);
    res.status(500).json({
      error: 'Failed to get QR code',
      message: error.message
    });
  }
});

// Update instance status (mainly for webhooks)
router.put('/:instanceId/status', authMiddleware.requirePermission('instances:write'), async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;
    const { status } = req.body;
    const tenantId = req.tenantId!;

    const validStatuses = ['connected', 'disconnected', 'waiting_qr', 'error'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const instance = await instanceService.getInstance(instanceId, tenantId);

    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found'
      });
    }

    await instanceService.updateInstanceStatus(instanceId, status);

    res.status(200).json({
      success: true,
      data: {
        id: instanceId,
        status,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Update instance status error:', error);
    res.status(500).json({
      error: 'Failed to update instance status',
      message: error.message
    });
  }
});

// Delete instance
router.delete('/:instanceId', authMiddleware.requirePermission('instances:delete'), async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.params;
    const tenantId = req.tenantId!;

    const success = await instanceService.deleteInstance(instanceId, tenantId);

    if (!success) {
      return res.status(404).json({
        error: 'Instance not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Instance deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete instance error:', error);
    res.status(500).json({
      error: 'Failed to delete instance',
      message: error.message
    });
  }
});

export default router;