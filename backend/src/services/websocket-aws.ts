import { ApiGatewayManagementApi } from '@aws-sdk/client-apigatewaymanagementapi';
import { DynamoDBService } from './dynamo';

export class WebSocketAWSService {
  private static instance: WebSocketAWSService;
  private dynamo: DynamoDBService;
  private connectionsTable: string;
  private apiGatewayEndpoint?: string;

  private constructor() {
    this.dynamo = new DynamoDBService();
    this.connectionsTable = `${process.env.DYNAMODB_TABLE_PREFIX || 'evo-saas'}_ws_connections`;
    this.apiGatewayEndpoint = process.env.WEBSOCKET_API_ENDPOINT;
  }

  static getInstance(): WebSocketAWSService {
    if (!WebSocketAWSService.instance) {
      WebSocketAWSService.instance = new WebSocketAWSService();
    }
    return WebSocketAWSService.instance;
  }

  async broadcastToTenant(tenantId: string, message: any): Promise<void> {
    if (!this.apiGatewayEndpoint) {
      console.warn('WebSocket API endpoint not configured, skipping broadcast');
      return;
    }

    try {
      // Get all connections for this tenant
      const connections = await this.dynamo.scan(this.connectionsTable, {
        FilterExpression: 'tenantId = :tenantId',
        ExpressionAttributeValues: {
          ':tenantId': tenantId,
        },
      });

      if (!connections || connections.length === 0) {
        console.log(`No WebSocket connections for tenant ${tenantId}`);
        return;
      }

      const apigwManagementApi = new ApiGatewayManagementApi({
        endpoint: this.apiGatewayEndpoint,
      });

      const messageData = JSON.stringify(message);

      // Send to all connections
      const promises = connections.map(async (connection: any) => {
        try {
          await apigwManagementApi.postToConnection({
            ConnectionId: connection.connectionId,
            Data: messageData,
          });
        } catch (error: any) {
          // If connection is stale, delete it
          if (error.statusCode === 410) {
            console.log(`Removing stale connection: ${connection.connectionId}`);
            await this.dynamo.delete(this.connectionsTable, {
              connectionId: connection.connectionId,
            });
          } else {
            console.error(`Error sending to ${connection.connectionId}:`, error);
          }
        }
      });

      await Promise.all(promises);
      console.log(`✅ Broadcast to ${connections.length} connection(s) for tenant ${tenantId}`);
    } catch (error) {
      console.error('Error broadcasting message:', error);
    }
  }

  async emitQRReady(tenantId: string, instanceId: string, qrCode: string): Promise<void> {
    await this.broadcastToTenant(tenantId, {
      type: 'qr:ready',
      instanceId,
      qrCode,
    });
  }

  async emitConnectionStatus(tenantId: string, instanceId: string, status: string): Promise<void> {
    await this.broadcastToTenant(tenantId, {
      type: 'connection:status',
      instanceId,
      status,
    });
  }
}
