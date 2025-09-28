import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  evolutionApi: {
    baseUrl: process.env.EVOLUTION_API_BASE_URL || '',
    token: process.env.EVOLUTION_API_TOKEN || '',
  },
  webhook: {
    secret: process.env.WA_WEBHOOK_SECRET || '',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  sqs: {
    queueUrl: process.env.SQS_QUEUE_URL || '',
  },
  dynamodb: {
    tablePrefix: process.env.DYNAMODB_TABLE_PREFIX || 'evo-saas',
  },
  s3: {
    bucketName: process.env.S3_BUCKET_NAME || '',
  },
};