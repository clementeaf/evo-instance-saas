import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { DynamoDBService } from '../services/dynamo';
import { ApiGatewayManagementApi } from '@aws-sdk/client-apigatewaymanagementapi';

const dynamo = new DynamoDBService();
const connectionsTable = `${process.env.DYNAMODB_TABLE_PREFIX || 'evo-saas'}_ws_connections`;

// Connect handler
export const connect: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;

  console.log(`🔌 WebSocket client connected: ${connectionId}`);

  try {
    await dynamo.put(connectionsTable, {
      connectionId,
      connectedAt: Date.now(),
      tenantId: 'default', // Will be updated on subscribe
    });

    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    console.error('Error on connect:', error);
    return { statusCode: 500, body: 'Failed to connect' };
  }
};

// Disconnect handler
export const disconnect: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;

  console.log(`🔌 WebSocket client disconnected: ${connectionId}`);

  try {
    await dynamo.delete(connectionsTable, { connectionId });
    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    console.error('Error on disconnect:', error);
    return { statusCode: 500, body: 'Failed to disconnect' };
  }
};

// Message handler (for subscribing to tenant)
export const message: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || '{}');

  console.log(`📨 WebSocket message from ${connectionId}:`, body);

  try {
    if (body.action === 'subscribe' && body.tenantId) {
      // Update connection with tenant ID
      await dynamo.update(connectionsTable, { connectionId }, {
        UpdateExpression: 'SET tenantId = :tenantId',
        ExpressionAttributeValues: {
          ':tenantId': body.tenantId,
        },
      });

      console.log(`✅ Client ${connectionId} subscribed to tenant:${body.tenantId}`);

      // Send confirmation
      const apigwManagementApi = new ApiGatewayManagementApi({
        endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
      });

      await apigwManagementApi.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify({
          type: 'subscribed',
          tenantId: body.tenantId,
        }),
      });
    }

    return { statusCode: 200, body: 'Message processed' };
  } catch (error) {
    console.error('Error processing message:', error);
    return { statusCode: 500, body: 'Failed to process message' };
  }
};
