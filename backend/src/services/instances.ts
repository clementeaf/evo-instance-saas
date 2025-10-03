import { DynamoDBService } from './dynamo';
import { WhatsAppInstance } from '../models/api-types';
import { MessagingProvider, MessagingProviderFactory } from './messaging';
import { config } from '../config';
import { nanoid } from 'nanoid';
import { WebSocketService } from './websocket';

export class InstanceService {
  private tableName: string;
  private dynamo: DynamoDBService;
  private messagingProvider: MessagingProvider;
  private wsService: WebSocketService;

  constructor() {
    this.tableName = `${process.env.DYNAMODB_TABLE_PREFIX || 'evo-saas'}_instances`;
    this.dynamo = new DynamoDBService();
    this.messagingProvider = MessagingProviderFactory.getInstance();
    this.wsService = WebSocketService.getInstance();
  }

  async createInstance(tenantId: string, name: string, webhookUrl?: string): Promise<WhatsAppInstance> {
    const instanceId = `inst_${nanoid(16)}`;

    const instance: WhatsAppInstance = {
      id: instanceId,
      tenantId,
      name,
      evolutionInstanceName: '', // Will be set by provider
      status: 'creating',
      webhookUrl,
      createdAt: Date.now()
    };

    try {
      // Save to database first
      await this.dynamo.put(this.tableName, instance);

      // Create instance using messaging provider
      const webhookConfig = webhookUrl || `${config.server.publicUrl}/api/v1/webhooks/receive`;

      const result = await this.messagingProvider.createInstance(
        tenantId,
        name,
        webhookConfig
      );

      // Update instance with provider data
      const updatedInstance = {
        ...instance,
        evolutionInstanceName: result.instanceId,
        status: result.status,
        ...(result.qrCode && { qrCode: result.qrCode })
      };

      const updateData: any = {
        evolutionInstanceName: result.instanceId,
        status: result.status
      };

      if (result.qrCode) {
        updateData.qrCode = result.qrCode;
      }

      await this.updateInstance(instanceId, updateData);

      console.log(`✅ Instance created: ${instanceId} (${result.instanceId}) via ${this.messagingProvider.getProviderName()}`);

      // Emit QR code if available
      if (result.qrCode) {
        this.wsService.emitQRReady(tenantId, instanceId, result.qrCode);
      }

      return updatedInstance;

    } catch (error: any) {
      console.error('Error creating instance:', error);

      // Update status to error
      await this.updateInstance(instanceId, {
        status: 'error'
      });

      throw new Error(`Failed to create WhatsApp instance: ${error.message}`);
    }
  }

  async getInstance(instanceId: string, tenantId: string): Promise<WhatsAppInstance | null> {
    try {
      const item = await this.dynamo.get(this.tableName, { id: instanceId });

      if (!item || item.tenantId !== tenantId) {
        return null;
      }

      const instance = item as WhatsAppInstance;

      // Sync status with messaging provider if not connected
      if (instance.status !== 'connected' && instance.evolutionInstanceName) {
        try {
          const connectionStatus = await this.messagingProvider.getConnectionStatus(instance.evolutionInstanceName);

          // Check if instance is connected
          if (connectionStatus.status === 'connected') {
            // Update to connected
            await this.updateInstance(instanceId, {
              status: 'connected',
              connectedAt: Date.now(),
              lastActivity: Date.now()
            });
            instance.status = 'connected';
            instance.connectedAt = Date.now();
          }
        } catch (err) {
          console.error('Error syncing with messaging provider:', err);
        }
      }

      return instance;
    } catch (error) {
      console.error('Error getting instance:', error);
      return null;
    }
  }

  async getInstances(tenantId: string): Promise<WhatsAppInstance[]> {
    try {
      const items = await this.dynamo.scan(this.tableName, {
        FilterExpression: 'tenantId = :tenantId',
        ExpressionAttributeValues: {
          ':tenantId': tenantId
        }
      });

      return (items || []) as WhatsAppInstance[];
    } catch (error) {
      console.error('Error getting instances:', error);
      return [];
    }
  }

  async getQRCode(instanceId: string, tenantId: string): Promise<string | null> {
    try {
      const instance = await this.getInstance(instanceId, tenantId);

      if (!instance) {
        throw new Error('Instance not found');
      }

      if (instance.status === 'connected') {
        throw new Error('Instance is already connected');
      }

      // Get QR code from messaging provider
      const qrCode = await this.messagingProvider.getQRCode(instance.evolutionInstanceName);

      if (qrCode) {
        // Update instance with QR code
        await this.updateInstance(instanceId, {
          qrCode: qrCode
        });

        // Emit QR ready event via WebSocket
        this.wsService.emitQRReady(tenantId, instanceId, qrCode);

        return qrCode;
      }

      return null;
    } catch (error: any) {
      console.error('Error getting QR code:', error);
      throw new Error(`Failed to get QR code: ${error.message}`);
    }
  }

  async updateInstanceStatus(instanceId: string, status: WhatsAppInstance['status']): Promise<void> {
    // Get instance to emit to correct tenant
    const instance = await this.dynamo.get(this.tableName, { id: instanceId });

    await this.updateInstance(instanceId, {
      status,
      ...(status === 'connected' ? { connectedAt: Date.now() } : {}),
      lastActivity: Date.now()
    });

    // Emit status update via WebSocket
    if (instance) {
      this.wsService.emitConnectionStatus(instance.tenantId, instanceId, status);
    }
  }

  async deleteInstance(instanceId: string, tenantId: string): Promise<boolean> {
    try {
      const instance = await this.getInstance(instanceId, tenantId);

      if (!instance) {
        return false;
      }

      // Delete from messaging provider (best effort)
      try {
        await this.messagingProvider.deleteInstance(instance.evolutionInstanceName);
        console.log(`✅ Instance disconnected from provider: ${instance.evolutionInstanceName}`);
      } catch (providerError) {
        console.error('Error disconnecting from messaging provider:', providerError);
      }

      // Delete from database
      await this.dynamo.delete(this.tableName, { id: instanceId });

      console.log(`✅ Instance deleted: ${instanceId}`);
      return true;

    } catch (error) {
      console.error('Error deleting instance:', error);
      return false;
    }
  }

  private async updateInstance(instanceId: string, updates: Partial<WhatsAppInstance>): Promise<void> {
    const updateExpression = Object.keys(updates)
      .map(key => `#${key} = :${key}`)
      .join(', ');

    const expressionAttributeNames = Object.keys(updates)
      .reduce((acc, key) => ({ ...acc, [`#${key}`]: key }), {});

    const expressionAttributeValues = Object.entries(updates)
      .reduce((acc, [key, value]) => ({ ...acc, [`:${key}`]: value }), {});

    await this.dynamo.update(this.tableName, { id: instanceId }, {
      UpdateExpression: `SET ${updateExpression}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    });
  }
}