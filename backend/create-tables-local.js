#!/usr/bin/env node

// Direct table creation for local DynamoDB
const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  },
});

async function createTables() {
  console.log('🔧 Creating tables in local DynamoDB...');

  try {
    // Create slots table
    console.log('Creating saas_slots table...');
    await client.send(new CreateTableCommand({
      TableName: 'saas_slots',
      KeySchema: [
        { AttributeName: 'slotId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'slotId', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }));
    console.log('✅ saas_slots created');

    // Create bookings table
    console.log('Creating saas_bookings table...');
    await client.send(new CreateTableCommand({
      TableName: 'saas_bookings',
      KeySchema: [
        { AttributeName: 'bookingId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'bookingId', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }));
    console.log('✅ saas_bookings created');

    console.log('\n🎉 All tables created successfully!');

  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('⚠️ Tables already exist');
    } else {
      console.error('❌ Error creating tables:', error);
    }
  }
}

createTables();