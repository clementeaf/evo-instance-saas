import 'dotenv/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  CreateTableCommand,
  DescribeTableCommand,
  UpdateTimeToLiveCommand
} from '@aws-sdk/client-dynamodb';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const DYNAMO_ENDPOINT = process.env.DYNAMO_ENDPOINT;
const DYNAMO_TABLE_SLOTS = process.env.DYNAMO_TABLE_SLOTS || 'saas_slots';
const DYNAMO_TABLE_BOOKINGS = process.env.DYNAMO_TABLE_BOOKINGS || 'saas_bookings';

const dynamoClient = new DynamoDBClient({
  region: AWS_REGION,
  ...(DYNAMO_ENDPOINT && { endpoint: DYNAMO_ENDPOINT }),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    return false;
  }
}

async function createSlotsTable() {
  const tableName = DYNAMO_TABLE_SLOTS;

  if (await tableExists(tableName)) {
    console.log(`✅ Table ${tableName} already exists`);
    return;
  }

  console.log(`🔧 Creating table ${tableName}...`);

  const command = new CreateTableCommand({
    TableName: tableName,
    KeySchema: [
      {
        AttributeName: 'slotId',
        KeyType: 'HASH'
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'slotId',
        AttributeType: 'S'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  });

  await dynamoClient.send(command);
  console.log(`✅ Table ${tableName} created successfully`);

  // Enable TTL on the ttl attribute
  console.log(`🔧 Enabling TTL on ${tableName}...`);
  try {
    await dynamoClient.send(new UpdateTimeToLiveCommand({
      TableName: tableName,
      TimeToLiveSpecification: {
        AttributeName: 'ttl',
        Enabled: true
      }
    }));
    console.log(`✅ TTL enabled on ${tableName}`);
  } catch (error) {
    console.warn(`⚠️ Could not enable TTL on ${tableName}:`, error);
    console.log('💡 You may need to enable TTL manually from AWS Console or CLI');
  }
}

async function createBookingsTable() {
  const tableName = DYNAMO_TABLE_BOOKINGS;

  if (await tableExists(tableName)) {
    console.log(`✅ Table ${tableName} already exists`);
    return;
  }

  console.log(`🔧 Creating table ${tableName}...`);

  const command = new CreateTableCommand({
    TableName: tableName,
    KeySchema: [
      {
        AttributeName: 'bookingId',
        KeyType: 'HASH'
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'bookingId',
        AttributeType: 'S'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  });

  await dynamoClient.send(command);
  console.log(`✅ Table ${tableName} created successfully`);
}

async function bootstrapTables() {
  console.log('🚀 Bootstrapping DynamoDB tables...');
  console.log(`Region: ${AWS_REGION}`);
  if (DYNAMO_ENDPOINT) {
    console.log(`Endpoint: ${DYNAMO_ENDPOINT}`);
  }

  try {
    await createSlotsTable();
    await createBookingsTable();

    console.log('\n🎉 All tables bootstrapped successfully!');
    console.log('\n📋 Tables created:');
    console.log(`- ${DYNAMO_TABLE_SLOTS} (Slots with TTL)`);
    console.log(`- ${DYNAMO_TABLE_BOOKINGS} (Bookings)`);

  } catch (error) {
    console.error('❌ Error bootstrapping tables:', error);
    process.exit(1);
  }
}

bootstrapTables();