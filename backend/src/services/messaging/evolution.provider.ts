import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  MessagingProvider,
  CreateInstanceResult,
  ConnectionStatus,
  SendMessageResult
} from './provider.interface';
import { nanoid } from 'nanoid';

/**
 * Evolution API Provider Implementation
 *
 * This provider implements WhatsApp messaging using the Evolution API.
 * Evolution API is a self-hosted solution that uses WhatsApp Web protocol.
 */
export class EvolutionProvider implements MessagingProvider {
  private client: AxiosInstance;
  private instanceMap: Map<string, string>; // Maps our instanceId to Evolution instanceName

  constructor(baseUrl: string, apiKey?: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'apikey': apiKey }),
      },
    });
    this.instanceMap = new Map();
  }

  getProviderName(): string {
    return 'evolution';
  }

  async createInstance(
    tenantId: string,
    instanceName: string,
    webhookUrl?: string
  ): Promise<CreateInstanceResult> {
    try {
      // Generate a unique Evolution instance name
      const evolutionInstanceName = `${tenantId}_${nanoid(8)}`;

      // Create instance in Evolution API
      const response = await this.client.post('/instance/create', {
        instanceName: evolutionInstanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      });

      // Configure webhook if provided - retry logic for reliability
      if (webhookUrl) {
        let webhookConfigured = false;
        const maxRetries = 3;

        for (let i = 0; i < maxRetries && !webhookConfigured; i++) {
          try {
            // Wait before attempting (exponential backoff: 500ms, 1s, 2s)
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, i)));

            await this.client.post(`/webhook/set/${evolutionInstanceName}`, {
              enabled: true,
              url: webhookUrl,
              webhook_by_events: false,
              webhook_base64: false,
              events: [
                'QRCODE_UPDATED',
                'CONNECTION_UPDATE',
                'MESSAGES_UPSERT',
                'MESSAGES_UPDATE',
                'SEND_MESSAGE'
              ]
            });

            webhookConfigured = true;
            console.log(`✅ Webhook configured for ${evolutionInstanceName}`);
          } catch (webhookError: any) {
            console.warn(`Attempt ${i + 1}/${maxRetries} - Failed to configure webhook for ${evolutionInstanceName}:`, webhookError.message);

            if (i === maxRetries - 1) {
              console.error(`❌ Failed to configure webhook after ${maxRetries} attempts`);
            }
          }
        }
      }

      // Store mapping
      this.instanceMap.set(evolutionInstanceName, evolutionInstanceName);

      return {
        instanceId: evolutionInstanceName,
        status: 'waiting_qr',
        qrCode: response.data?.qrcode?.base64,
        metadata: {
          evolutionData: response.data
        }
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new Error(
          `Evolution API Error: ${axiosError.message} - ${JSON.stringify(axiosError.response?.data)}`
        );
      }
      throw error;
    }
  }

  async getConnectionStatus(instanceId: string): Promise<ConnectionStatus> {
    try {
      const response = await this.client.get(`/instance/connectionState/${instanceId}`);
      const state = response.data?.instance?.state || response.data?.state;

      let status: ConnectionStatus['status'] = 'disconnected';

      if (state === 'open') {
        status = 'connected';
      } else if (state === 'connecting' || state === 'close') {
        status = 'connecting';
      } else if (state === 'closed') {
        status = 'disconnected';
      }

      return {
        status,
        details: JSON.stringify(response.data),
        lastSeen: Date.now()
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        return {
          status: 'error',
          details: `Evolution API Error: ${axiosError.message}`
        };
      }
      return {
        status: 'error',
        details: 'Unknown error'
      };
    }
  }

  async getQRCode(instanceId: string): Promise<string | null> {
    try {
      const response = await this.client.get(`/instance/connect/${instanceId}`);
      return response.data?.qrcode?.base64 || response.data?.base64 || null;
    } catch (error) {
      console.error('Error getting QR code from Evolution API:', error);
      return null;
    }
  }

  async sendMessage(
    instanceId: string,
    to: string,
    message: string
  ): Promise<SendMessageResult> {
    // Check if dry-run mode is enabled
    if (process.env.EVOLUTION_DRY_RUN === 'true') {
      console.log(`🧪 DRY RUN: Would send message to ${to}: "${message}"`);
      return {
        messageId: `dry_run_${nanoid(16)}`,
        success: true,
        timestamp: Date.now()
      };
    }

    try {
      const response = await this.client.post(`/message/sendText/${instanceId}`, {
        number: to.replace('+', ''), // Remove + from phone number
        textMessage: {
          text: message
        }
      });

      console.log(`✅ Evolution API: Message sent to ${to} via ${instanceId}`);

      return {
        messageId: response.data?.key?.id || `msg_${nanoid(16)}`,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const errorDetails = axiosError.response?.data || axiosError.message;

        console.error(`❌ Evolution API Error (${instanceId}):`, {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          message: axiosError.message
        });

        return {
          messageId: `failed_${nanoid(16)}`,
          success: false,
          timestamp: Date.now(),
          error: `Evolution API Error (${axiosError.response?.status || 'unknown'}): ${JSON.stringify(errorDetails)}`
        };
      }

      console.error(`❌ Unknown error sending message:`, error);

      return {
        messageId: `failed_${nanoid(16)}`,
        success: false,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteInstance(instanceId: string): Promise<boolean> {
    try {
      // Evolution API typically uses logout or delete endpoint
      await this.client.delete(`/instance/logout/${instanceId}`);
      this.instanceMap.delete(instanceId);
      return true;
    } catch (error) {
      console.error('Error deleting instance from Evolution API:', error);
      return false;
    }
  }
}
