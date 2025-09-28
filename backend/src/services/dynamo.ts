import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
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
} else {
  // For AWS DynamoDB, use real credentials
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  };
}

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