export interface WebhookEvent {
  timestamp: string;
  headers: any;
  body: any;
  source: string;
}

export interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: number;
  pushName?: string;
}

export interface EvolutionAPIEvent {
  event: string;
  instance: string;
  data: WhatsAppMessage | any;
}

export interface BotConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  instance: string;
  triggers: string[];
}

export interface Tenant {
  id: string;
  name: string;
  instances: string[];
  bots: BotConfig[];
  createdAt: string;
  updatedAt: string;
}