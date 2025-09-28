import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { config } from '../config';

const sqsClient = new SQSClient({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

export class SQSService {
  static async sendMessage(message: any): Promise<void> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: config.sqs.queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          timestamp: {
            DataType: 'String',
            StringValue: new Date().toISOString(),
          },
          source: {
            DataType: 'String',
            StringValue: 'evolution-api-webhook',
          },
        },
      });

      const result = await sqsClient.send(command);
      console.log(`✅ Message sent to SQS: ${result.MessageId}`);
    } catch (error) {
      console.error('❌ Error sending message to SQS:', error);
      throw error;
    }
  }
}