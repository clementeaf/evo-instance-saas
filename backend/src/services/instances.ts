import { DynamoDBService } from './dynamo';
import { WhatsAppInstance } from '../models/api-types';
import { EvolutionClient } from './evolution';
import { config } from '../config';
import { nanoid } from 'nanoid';

export class InstanceService {
  private tableName: string;
  private dynamo: DynamoDBService;
  private evolutionClient: EvolutionClient;

  constructor() {
    this.tableName = `${process.env.DYNAMODB_TABLE_PREFIX || 'evo-saas'}_instances`;
    this.dynamo = new DynamoDBService();
    this.evolutionClient = new EvolutionClient(
      config.evolutionApi.baseUrl,
      config.evolutionApi.token
    );
  }

  async createInstance(tenantId: string, name: string, webhookUrl?: string): Promise<WhatsAppInstance> {
    const instanceId = `inst_${nanoid(16)}`;
    const evolutionInstanceName = `${tenantId}_${nanoid(8)}`;

    const instance: WhatsAppInstance = {
      id: instanceId,
      tenantId,
      name,
      evolutionInstanceName,
      status: 'creating',
      webhookUrl,
      createdAt: Date.now()
    };

    try {
      // Save to database first
      await this.dynamo.put(this.tableName, instance);

      // Create instance in Evolution API
      const webhookConfig = webhookUrl || `${config.server.publicUrl}/api/v1/webhooks/receive`;

      await this.evolutionClient.createInstance({
        instanceName: evolutionInstanceName,
        webhook: {
          url: webhookConfig,
          headers: {
            'X-Tenant-Id': tenantId,
            'X-Instance-Id': instanceId
          }
        }
      });

      // Update status to waiting for QR
      const updatedInstance = {
        ...instance,
        status: 'waiting_qr' as const
      };

      await this.updateInstance(instanceId, { status: 'waiting_qr' });

      console.log(`✅ Instance created: ${instanceId} (${evolutionInstanceName})`);

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

      // Sync status with Evolution API if not connected
      if (instance.status !== 'connected' && instance.evolutionInstanceName) {
        try {
          const evolutionState = await this.evolutionClient.getInstance(instance.evolutionInstanceName);

          // Check if instance is connected in Evolution API
          if (evolutionState?.instance?.state === 'open') {
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
          console.error('Error syncing with Evolution API:', err);
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

      // Connect to Evolution API to get QR code
      const connectResult = await this.evolutionClient.connectInstance(instance.evolutionInstanceName);

      if (connectResult?.base64) {
        // Update instance with QR code
        await this.updateInstance(instanceId, {
          qrCode: connectResult.base64
        });

        return connectResult.base64;
      }

      return null;
    } catch (error: any) {
      console.error('Error getting QR code:', error);
      throw new Error(`Failed to get QR code: ${error.message}`);
    }
  }

  async updateInstanceStatus(instanceId: string, status: WhatsAppInstance['status']): Promise<void> {
    await this.updateInstance(instanceId, {
      status,
      ...(status === 'connected' ? { connectedAt: Date.now() } : {}),
      lastActivity: Date.now()
    });
  }

  async deleteInstance(instanceId: string, tenantId: string): Promise<boolean> {
    try {
      const instance = await this.getInstance(instanceId, tenantId);

      if (!instance) {
        return false;
      }

      // Delete from Evolution API (best effort)
      try {
        // Evolution API doesn't have a direct delete endpoint, so we disconnect
        // This would need to be implemented based on Evolution API capabilities
        console.log(`Disconnecting instance ${instance.evolutionInstanceName}`);
      } catch (evolutionError) {
        console.error('Error disconnecting from Evolution API:', evolutionError);
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