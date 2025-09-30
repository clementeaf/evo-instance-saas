import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../../middleware/auth';
import { EvolutionClient } from '../../services/evolution';
import { MessageRequest, MessageResponse, BulkMessageRequest } from '../../models/api-types';
import { config } from '../../config';
import { nanoid } from 'nanoid';

const router = Router();
const authMiddleware = new AuthMiddleware();

const evolutionClient = new EvolutionClient(
  config.evolutionApi.baseUrl,
  config.evolutionApi.token
);

// Apply authentication and rate limiting to all routes
router.use(authMiddleware.authenticate);
router.use(authMiddleware.rateLimit(60)); // 60 requests per minute

// Send single message
router.post('/send', authMiddleware.requirePermission('messages:send'), async (req: Request, res: Response) => {
  try {
    const messageRequest: MessageRequest = req.body;

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

    const messageId = `msg_${nanoid(16)}`;

    try {
      // Send message via Evolution API
      const result = await evolutionClient.sendText({
        instanceName: messageRequest.instance_id,
        to: messageRequest.to,
        body: messageRequest.message
      });

      const response: MessageResponse = {
        id: messageId,
        status: 'sent',
        timestamp: Date.now(),
        instance_id: messageRequest.instance_id,
        to: messageRequest.to
      };

      console.log(`✅ Message sent via API: ${messageId} to ${messageRequest.to}`);

      res.status(200).json({
        success: true,
        data: response
      });

    } catch (evolutionError: any) {
      console.error('Evolution API error:', evolutionError);

      const response: MessageResponse = {
        id: messageId,
        status: 'failed',
        timestamp: Date.now(),
        instance_id: messageRequest.instance_id,
        to: messageRequest.to,
        error: evolutionError.message || 'Failed to send message'
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

        // Send message
        await evolutionClient.sendText({
          instanceName: bulkRequest.instance_id,
          to: message.to,
          body: message.message
        });

        results.push({
          id: messageId,
          status: 'sent',
          timestamp: Date.now(),
          instance_id: bulkRequest.instance_id,
          to: message.to
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