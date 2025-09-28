import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { config } from '../config';

const dynamodbClient = new DynamoDBClient({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

export const dynamoDocClient = DynamoDBDocumentClient.from(dynamodbClient);

export class DynamoDBService {
  static getTableName(tableName: string): string {
    return `${config.dynamodb.tablePrefix}-${tableName}`;
  }
}