import { WhatsAppMessage, BotConfig } from '../models/types';
import { EvolutionAPIService } from '../services/evolution-api';

export abstract class BaseBot {
  protected config: BotConfig;
  protected evolutionAPI: EvolutionAPIService;

  constructor(config: BotConfig) {
    this.config = config;
    this.evolutionAPI = new EvolutionAPIService();
  }

  abstract processMessage(message: WhatsAppMessage): Promise<void>;

  protected async sendMessage(to: string, text: string): Promise<void> {
    try {
      await this.evolutionAPI.sendMessage(this.config.instance, {
        number: to,
        text: text,
      });
    } catch (error) {
      console.error(`❌ Error sending message from bot ${this.config.name}:`, error);
    }
  }

  protected shouldProcess(message: WhatsAppMessage): boolean {
    if (!this.config.enabled) return false;

    const text = message.message?.conversation ||
                 message.message?.extendedTextMessage?.text || '';

    return this.config.triggers.some(trigger =>
      text.toLowerCase().includes(trigger.toLowerCase())
    );
  }
}