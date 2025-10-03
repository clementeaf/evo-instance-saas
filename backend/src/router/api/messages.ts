import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth';
import { MessagingProviderFactory } from '../../services/messaging';
import { MessageRequest, MessageResponse, BulkMessageRequest } from '../../models/api-types';
import { InstanceService } from '../../services/instances';
import { nanoid } from 'nanoid';

const router = Router();
const authMiddleware = new AuthMiddleware();
const messagingProvider = MessagingProviderFactory.getInstance();
const instanceService = new InstanceService();

// Apply authentication and rate limiting to all routes
router.use(authMiddleware.authenticate);
router.use(authMiddleware.rateLimit(60)); // 60 requests per minute

// Send single message
router.post('/send', authMiddleware.requirePermission('messages:send'), async (req: Request, res: Response) => {
  try {
    const messageRequest: MessageRequest = req.body;
    const tenantId = req.tenantId!;

    // Validate required fields
    if (!messageRequest.instance_id || !messageRequest.to || !messageRequest.message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'instance_id, to, and message are required'
      });
    }

    // Validate phone number format
    if (!messageRequest.to.match(/^\+?[1-9]\d{1,14}$/)) {
      return res.status(400).json({
        error: 'Invalid phone number',
        message: 'Phone number must be in international format'
      });
    }

    try {
      // Get instance to retrieve evolutionInstanceName
      const instance = await instanceService.getInstance(messageRequest.instance_id, tenantId);

      if (!instance) {
        return res.status(404).json({
          error: 'Instance not found',
          message: 'The specified instance does not exist or you do not have access to it'
        });
      }

      if (instance.status !== 'connected') {
        return res.status(400).json({
          error: 'Instance not connected',
          message: `Instance is ${instance.status}. It must be connected to send messages.`
        });
      }

      // Send message via messaging provider using evolutionInstanceName
      const result = await messagingProvider.sendMessage(
        instance.evolutionInstanceName,
        messageRequest.to,
        messageRequest.message
      );

      const response: MessageResponse = {
        id: result.messageId,
        status: result.success ? 'sent' : 'failed',
        timestamp: result.timestamp,
        instance_id: messageRequest.instance_id,
        to: messageRequest.to,
        error: result.error
      };

      console.log(`✅ Message sent via ${messagingProvider.getProviderName()}: ${result.messageId} to ${messageRequest.to}`);

      res.status(result.success ? 200 : 500).json({
        success: result.success,
        data: response,
        ...(result.error && { error: result.error })
      });

    } catch (providerError: any) {
      console.error('Messaging provider error:', providerError);

      const response: MessageResponse = {
        id: `msg_${nanoid(16)}`,
        status: 'failed',
        timestamp: Date.now(),
        instance_id: messageRequest.instance_id,
        to: messageRequest.to,
        error: providerError.message || 'Failed to send message'
      };

      res.status(500).json({
        success: false,
        data: response,
        error: 'Failed to send message via WhatsApp'
      });
    }

  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
    return;
  }
});

// Send bulk messages
router.post('/bulk', authMiddleware.requirePermission('messages:send'), async (req: Request, res: Response) => {
  try {
    const bulkRequest: BulkMessageRequest = req.body;
    const tenantId = req.tenantId!;

    if (!bulkRequest.instance_id || !bulkRequest.messages || !Array.isArray(bulkRequest.messages)) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'instance_id and messages array are required'
      });
    }

    if (bulkRequest.messages.length === 0) {
      return res.status(400).json({
        error: 'Empty messages array',
        message: 'At least one message is required'
      });
    }

    if (bulkRequest.messages.length > 100) {
      return res.status(400).json({
        error: 'Too many messages',
        message: 'Maximum 100 messages per bulk request'
      });
    }

    // Get instance to retrieve evolutionInstanceName
    const instance = await instanceService.getInstance(bulkRequest.instance_id, tenantId);

    if (!instance) {
      return res.status(404).json({
        error: 'Instance not found',
        message: 'The specified instance does not exist or you do not have access to it'
      });
    }

    if (instance.status !== 'connected') {
      return res.status(400).json({
        error: 'Instance not connected',
        message: `Instance is ${instance.status}. It must be connected to send messages.`
      });
    }

    const results: MessageResponse[] = [];

    // Process messages sequentially to avoid overwhelming Evolution API
    for (const message of bulkRequest.messages) {
      const messageId = `msg_${nanoid(16)}`;

      try {
        // Validate individual message
        if (!message.to || !message.message) {
          results.push({
            id: messageId,
            status: 'failed',
            timestamp: Date.now(),
            instance_id: bulkRequest.instance_id,
            to: message.to || 'unknown',
            error: 'Missing to or message field'
          });
          continue;
        }

        // Send message via messaging provider using evolutionInstanceName
        const result = await messagingProvider.sendMessage(
          instance.evolutionInstanceName,
          message.to,
          message.message
        );

        results.push({
          id: result.messageId,
          status: result.success ? 'sent' : 'failed',
          timestamp: result.timestamp,
          instance_id: bulkRequest.instance_id,
          to: message.to,
          error: result.error
        });

        // Small delay between messages to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        results.push({
          id: messageId,
          status: 'failed',
          timestamp: Date.now(),
          instance_id: bulkRequest.instance_id,
          to: message.to,
          error: error.message || 'Failed to send message'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length;
    const failureCount = results.filter(r => r.status === 'failed').length;

    console.log(`📊 Bulk message results: ${successCount} sent, ${failureCount} failed`);

    res.status(200).json({
      success: true,
      data: {
        total: results.length,
        sent: successCount,
        failed: failureCount,
        results
      }
    });

  } catch (error: any) {
    console.error('Bulk send error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
    return;
  }
});

// Get message status (placeholder for future implementation)
router.get('/:messageId/status', authMiddleware.requirePermission('messages:read'), async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    // This would typically query a messages table in DynamoDB
    // For now, return a placeholder response
    res.status(200).json({
      success: true,
      data: {
        id: messageId,
        status: 'delivered', // This would come from webhook data
        timestamp: Date.now(),
        delivered_at: Date.now() - 1000
      }
    });

  } catch (error: any) {
    console.error('Get message status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;