import { BaseBot } from './base-bot';
import { WhatsAppMessage, BotConfig } from '../models/types';

export class GreetingBot extends BaseBot {
  constructor(config: BotConfig) {
    super(config);
  }

  async processMessage(message: WhatsAppMessage): Promise<void> {
    if (!this.shouldProcess(message)) return;

    const from = message.key.remoteJid;
    const userName = message.pushName || 'Usuario';

    const greetingMessage = `¡Hola ${userName}! 👋\n\nBienvenido a nuestro servicio. ¿En qué puedo ayudarte hoy?`;

    await this.sendMessage(from, greetingMessage);

    console.log(`👋 Greeting sent to ${from} by bot ${this.config.name}`);
  }
}