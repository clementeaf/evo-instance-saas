import { DynamoDBService } from './dynamo';
import { APIKey } from '../models/api-types';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

export class APIKeyService {
  private tableName: string;
  private dynamo: DynamoDBService;

  constructor() {
    this.tableName = `${process.env.DYNAMODB_TABLE_PREFIX || 'evo-saas'}_api_keys`;
    this.dynamo = new DynamoDBService();
  }

  async createAPIKey(tenantId: string, name: string, permissions: string[] = ['messages:send']): Promise<APIKey> {
    const id = `ak_${nanoid(16)}`;
    const key = this.generateAPIKey();

    const apiKey: APIKey = {
      id,
      key,
      tenantId,
      name,
      permissions,
      isActive: true,
      createdAt: Date.now(),
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      }
    };

    await this.dynamo.put(this.tableName, apiKey);
    return apiKey;
  }

  async validateAPIKey(key: string): Promise<APIKey | null> {
    try {
      const items = await this.dynamo.scan(this.tableName, {
        FilterExpression: '#key = :key AND #isActive = :isActive',
        ExpressionAttributeNames: {
          '#key': 'key',
          '#isActive': 'isActive'
        },
        ExpressionAttributeValues: {
          ':key': key,
          ':isActive': true
        }
      });

      if (!items || items.length === 0) {
        return null;
      }

      const apiKey = items[0] as APIKey;

      // Update last used timestamp
      await this.updateLastUsed(apiKey.id);

      return apiKey;
    } catch (error) {
      console.error('Error validating API key:', error);
      return null;
    }
  }

  async getAPIKeys(tenantId: string): Promise<APIKey[]> {
    const items = await this.dynamo.scan(this.tableName, {
      FilterExpression: 'tenantId = :tenantId',
      ExpressionAttributeValues: {
        ':tenantId': tenantId
      }
    });

    return (items || []) as APIKey[];
  }

  async revokeAPIKey(keyId: string, tenantId: string): Promise<boolean> {
    try {
      await this.dynamo.update(this.tableName, { id: keyId }, {
        UpdateExpression: 'SET #isActive = :isActive',
        ConditionExpression: 'tenantId = :tenantId',
        ExpressionAttributeNames: {
          '#isActive': 'isActive'
        },
        ExpressionAttributeValues: {
          ':isActive': false,
          ':tenantId': tenantId
        }
      });

      return true;
    } catch (error) {
      console.error('Error revoking API key:', error);
      return false;
    }
  }

  private async updateLastUsed(keyId: string): Promise<void> {
    try {
      await this.dynamo.update(this.tableName, { id: keyId }, {
        UpdateExpression: 'SET lastUsedAt = :timestamp',
        ExpressionAttributeValues: {
          ':timestamp': Date.now()
        }
      });
    } catch (error) {
      console.error('Error updating last used timestamp:', error);
    }
  }

  private generateAPIKey(): string {
    const prefix = 'pk_live_';
    const randomBytes = crypto.randomBytes(32);
    const key = randomBytes.toString('base64')
      .replace(/[+/=]/g, '')
      .substring(0, 32);

    return `${prefix}${key}`;
  }

  hasPermission(apiKey: APIKey, permission: string): boolean {
    return apiKey.permissions.includes(permission) || apiKey.permissions.includes('*');
  }
}