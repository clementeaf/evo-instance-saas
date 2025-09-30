export interface APIKey {
  id: string;
  key: string;
  tenantId: string;
  name: string;
  permissions: string[];
  isActive: boolean;
  createdAt: number;
  lastUsedAt?: number;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export interface WhatsAppInstance {
  id: string;
  tenantId: string;
  name: string;
  evolutionInstanceName: string;
  status: 'creating' | 'waiting_qr' | 'connected' | 'disconnected' | 'error';
  qrCode?: string;
  webhookUrl?: string;
  createdAt: number;
  connectedAt?: number;
  lastActivity?: number;
}

export interface MessageRequest {
  instance_id: string;
  to: string;
  message: string;
  type?: 'text' | 'image' | 'document';
  media_url?: string;
}

export interface MessageResponse {
  id: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: number;
  instance_id: string;
  to: string;
  error?: string;
}

export interface BulkMessageRequest {
  instance_id: string;
  messages: Array<{
    to: string;
    message: string;
  }>;
}

export interface WebhookRegistration {
  id: string;
  tenantId: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  createdAt: number;
}