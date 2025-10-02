import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  UpdateTimeToLiveCommand
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
  PutCommandInput,
  GetCommandInput,
  UpdateCommandInput,
  QueryCommandInput,
  DeleteCommandInput
} from '@aws-sdk/lib-dynamodb';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const DYNAMO_ENDPOINT = process.env.DYNAMO_ENDPOINT;
const DYNAMO_TABLE_SLOTS = process.env.DYNAMO_TABLE_SLOTS || 'saas_slots';
const DYNAMO_TABLE_BOOKINGS = process.env.DYNAMO_TABLE_BOOKINGS || 'saas_bookings';

// Configure client for local or AWS DynamoDB
const clientConfig: any = {
  region: AWS_REGION,
};

// If using local DynamoDB endpoint
if (DYNAMO_ENDPOINT) {
  clientConfig.endpoint = DYNAMO_ENDPOINT;
  // For local DynamoDB, use dummy credentials
  clientConfig.credentials = {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  };
}
// For AWS Lambda, credentials are provided automatically via IAM role
// No need to set credentials explicitly

const dynamoClient = new DynamoDBClient(clientConfig);

export const ddb = DynamoDBDocumentClient.from(dynamoClient);

export const tableNames = {
  slots: DYNAMO_TABLE_SLOTS,
  bookings: DYNAMO_TABLE_BOOKINGS,
};

// Generic helpers
export async function put(params: Omit<PutCommandInput, 'TableName'> & { TableName: string }) {
  const command = new PutCommand(params);
  return await ddb.send(command);
}

export async function get(params: Omit<GetCommandInput, 'TableName'> & { TableName: string }) {
  const command = new GetCommand(params);
  return await ddb.send(command);
}

export async function update(params: Omit<UpdateCommandInput, 'TableName'> & { TableName: string }) {
  const command = new UpdateCommand(params);
  return await ddb.send(command);
}

export async function query(params: Omit<QueryCommandInput, 'TableName'> & { TableName: string }) {
  const command = new QueryCommand(params);
  return await ddb.send(command);
}

export async function deleteItem(params: Omit<DeleteCommandInput, 'TableName'> & { TableName: string }) {
  const command = new DeleteCommand(params);
  return await ddb.send(command);
}

// Service class for easier usage
export class DynamoDBService {
  private tableCache = new Set<string>();

  async put(tableName: string, item: any) {
    await this.ensureTableExists(tableName);
    return await put({ TableName: tableName, Item: item });
  }

  async get(tableName: string, key: any) {
    await this.ensureTableExists(tableName);
    const result = await get({ TableName: tableName, Key: key });
    return result.Item;
  }

  async update(tableName: string, key: any, updateParams: any) {
    await this.ensureTableExists(tableName);
    return await update({
      TableName: tableName,
      Key: key,
      ...updateParams
    });
  }

  async scan(tableName: string, scanParams: any = {}) {
    await this.ensureTableExists(tableName);
    const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
    const command = new ScanCommand({
      TableName: tableName,
      ...scanParams
    });
    const result = await ddb.send(command) as any;
    return result.Items;
  }

  async delete(tableName: string, key: any) {
    await this.ensureTableExists(tableName);
    return await deleteItem({ TableName: tableName, Key: key });
  }

  /**
   * Ensures a table exists before performing operations
   * Uses cache to avoid repeated checks
   */
  private async ensureTableExists(tableName: string): Promise<void> {
    // Skip if we already verified this table exists
    if (this.tableCache.has(tableName)) {
      return;
    }

    try {
      await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
      this.tableCache.add(tableName);
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        console.log(`⚠️  Table ${tableName} not found, creating it...`);
        await this.createTable(tableName);
        this.tableCache.add(tableName);
      } else {
        throw error;
      }
    }
  }

  /**
   * Creates a DynamoDB table based on naming convention
   */
  private async createTable(tableName: string): Promise<void> {
    // Determine table schema based on name
    if (tableName.includes('instances')) {
      await this.createInstancesTable(tableName);
    } else if (tableName.includes('api-keys') || tableName.includes('api_keys')) {
      await this.createAPIKeysTable(tableName);
    } else if (tableName.includes('slots')) {
      await this.createSlotsTable(tableName);
    } else if (tableName.includes('bookings')) {
      await this.createBookingsTable(tableName);
    } else if (tableName.includes('conversation') || tableName.includes('states')) {
      await this.createConversationStatesTable(tableName);
    } else {
      // Generic table creation
      await this.createGenericTable(tableName);
    }

    console.log(`✅ Table ${tableName} created successfully`);
  }

  private async createInstancesTable(tableName: string) {
    await dynamoClient.send(new CreateTableCommand({
      TableName: tableName,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'tenantId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [{
        IndexName: 'tenantId-index',
        KeySchema: [{ AttributeName: 'tenantId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' }
      }],
      BillingMode: 'PAY_PER_REQUEST'
    }));
  }

  private async createAPIKeysTable(tableName: string) {
    await dynamoClient.send(new CreateTableCommand({
      TableName: tableName,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'key', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [{
        IndexName: 'key-index',
        KeySchema: [{ AttributeName: 'key', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' }
      }],
      BillingMode: 'PAY_PER_REQUEST'
    }));
  }

  private async createSlotsTable(tableName: string) {
    await dynamoClient.send(new CreateTableCommand({
      TableName: tableName,
      KeySchema: [{ AttributeName: 'slotId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'slotId', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST'
    }));

    // Enable TTL
    try {
      await dynamoClient.send(new UpdateTimeToLiveCommand({
        TableName: tableName,
        TimeToLiveSpecification: { AttributeName: 'ttl', Enabled: true }
      }));
    } catch (error) {
      console.warn(`⚠️  Could not enable TTL on ${tableName}`);
    }
  }

  private async createBookingsTable(tableName: string) {
    await dynamoClient.send(new CreateTableCommand({
      TableName: tableName,
      KeySchema: [{ AttributeName: 'bookingId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'bookingId', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST'
    }));
  }

  private async createConversationStatesTable(tableName: string) {
    await dynamoClient.send(new CreateTableCommand({
      TableName: tableName,
      KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'userId', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST'
    }));
  }

  private async createGenericTable(tableName: string) {
    await dynamoClient.send(new CreateTableCommand({
      TableName: tableName,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST'
    }));
  }
}