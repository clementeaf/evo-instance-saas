import 'dotenv/config';
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { EvolutionClient } from '../services/evolution';
import { BotRegistry } from '../bots/registry';
import { config } from '../config';
import { createStateStore, ConversationState } from '../services/state';
import { extractText, buildStateKey, createStateHelpers } from '../bots/runtime';

const INSTANCE_NAME = process.env.INSTANCE_NAME || 'wa-mvp';
const DEFAULT_BOT = process.env.DEFAULT_BOT || 'menu-basic';
const TENANT_ID = process.env.TENANT_ID || 'mvp';
const EVOLUTION_DRY_RUN = process.env.EVOLUTION_DRY_RUN === 'true';

const sqsClient = new SQSClient({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

const evo = new EvolutionClient(
  config.evolutionApi.baseUrl,
  config.evolutionApi.token
);

const stateStore = createStateStore();

async function sendText(to: string, body: string): Promise<void> {
  if (EVOLUTION_DRY_RUN) {
    console.log('[DRY-RUN] sendText', { to, body });
    return;
  }

  try {
    await evo.sendText({
      instanceName: INSTANCE_NAME,
      to,
      body,
    });
    console.log(`✅ Message sent to ${to}`);
  } catch (error) {
    console.error('❌ Error sending message:', error);
  }
}

async function processMessage(message: any) {
  try {
    const messageBody = JSON.parse(message.Body);
    console.log('📨 Processing message:', messageBody);

    // Extract message data safely
    const from = messageBody.from;
    const text = extractText(messageBody);

    if (!from) {
      console.log('⚠️ No sender found, skipping message');
      return;
    }

    // Determine tenant ID from headers or environment
    const tenantId = messageBody.headers?.["X-Tenant"] ?? TENANT_ID;

    // Build state key and get current state
    const stateKey = buildStateKey(tenantId, from);
    const state = await stateStore.get(stateKey);

    // Handle global "MENÚ" command
    if (text?.toUpperCase() === "MENÚ") {
      await stateStore.set(stateKey, {
        botKey: "menu-basic",
        fsm: undefined,
        data: {},
        updatedAt: Date.now()
      });
      console.log(`🔄 ${from} returned to main menu`);
    }

    // Determine active bot
    const currentState = await stateStore.get(stateKey);
    const botKey = currentState?.botKey ?? DEFAULT_BOT;
    const Bot = BotRegistry.get(botKey);

    // Create state helpers
    const { setState, clearState } = createStateHelpers(stateStore, stateKey, currentState);

    // Create bot context
    const ctx = {
      tenantId,
      instanceName: INSTANCE_NAME,
      from,
      text,
      stateStore,
      stateKey,
      state: currentState,
      setState,
      clearState,
      sendText,
    };

    console.log(`🤖 Invoking bot ${botKey} for ${from} (tenant: ${tenantId})`);
    await Bot.handleMessage(ctx);

  } catch (error) {
    console.error('❌ Error processing message:', error);
  }
}

async function pollMessages() {
  console.log('🔄 Starting SQS polling...');
  console.log(`Instance: ${INSTANCE_NAME}`);
  console.log(`Default Bot: ${DEFAULT_BOT}`);
  console.log(`Tenant ID: ${TENANT_ID}`);
  console.log(`Dry run: ${EVOLUTION_DRY_RUN}`);

  while (true) {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: config.sqs.queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
        VisibilityTimeout: 30,
      });

      const result = await sqsClient.send(command);

      if (result.Messages) {
        console.log(`📥 Received ${result.Messages.length} messages`);

        for (const message of result.Messages) {
          await processMessage(message);

          // Delete message after processing
          await sqsClient.send(new DeleteMessageCommand({
            QueueUrl: config.sqs.queueUrl,
            ReceiptHandle: message.ReceiptHandle,
          }));
        }
      }
    } catch (error) {
      console.error('❌ Error polling SQS:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

pollMessages();