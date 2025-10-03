/**
 * Messaging Provider Interface
 *
 * This interface defines the contract that all messaging providers must implement.
 * This allows for easy switching between different providers (Evolution API, Meta WhatsApp Cloud API, etc.)
 */

export interface CreateInstanceResult {
  instanceId: string;
  qrCode?: string;
  status: 'creating' | 'waiting_qr' | 'connected' | 'disconnected' | 'error';
  metadata?: Record<string, any>;
}

export interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  details?: string;
  lastSeen?: number;
}

export interface SendMessageResult {
  messageId: string;
  success: boolean;
  timestamp: number;
  error?: string;
}

export interface MessagingProvider {
  /**
   * Create a new WhatsApp instance
   * @param tenantId - The tenant ID that owns this instance
   * @param instanceName - User-friendly name for the instance
   * @param webhookUrl - URL to receive webhooks (optional)
   * @returns Instance creation result with QR code if applicable
   */
  createInstance(
    tenantId: string,
    instanceName: string,
    webhookUrl?: string
  ): Promise<CreateInstanceResult>;

  /**
   * Get the connection status of an instance
   * @param instanceId - The instance identifier
   * @returns Current connection status
   */
  getConnectionStatus(instanceId: string): Promise<ConnectionStatus>;

  /**
   * Get QR code for instance authentication (if applicable)
   * @param instanceId - The instance identifier
   * @returns Base64 encoded QR code or null if not available
   */
  getQRCode(instanceId: string): Promise<string | null>;

  /**
   * Send a text message
   * @param instanceId - The instance identifier
   * @param to - Recipient phone number (international format)
   * @param message - Message text
   * @returns Send result with message ID
   */
  sendMessage(
    instanceId: string,
    to: string,
    message: string
  ): Promise<SendMessageResult>;

  /**
   * Delete/disconnect an instance
   * @param instanceId - The instance identifier
   * @returns Success status
   */
  deleteInstance(instanceId: string): Promise<boolean>;

  /**
   * Get the provider name
   * @returns Provider identifier (e.g., 'evolution', 'meta')
   */
  getProviderName(): string;
}
