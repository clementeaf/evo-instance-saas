import {
  MessagingProvider,
  CreateInstanceResult,
  ConnectionStatus,
  SendMessageResult
} from './provider.interface';
import { nanoid } from 'nanoid';

/**
 * Meta WhatsApp Cloud API Provider Implementation (STUB)
 *
 * This is a stub implementation for future integration with Meta's WhatsApp Cloud API.
 * Meta's approach is different from Evolution API:
 * - No QR codes (uses pre-registered business phone numbers)
 * - No concept of "instances" (uses phone number IDs)
 * - Requires Meta Business verification
 * - Template-based messaging for initial contact
 *
 * To implement this fully, you'll need:
 * 1. Meta Developer Account
 * 2. Business Verification
 * 3. WhatsApp Business Account
 * 4. System User Access Token
 */
export class MetaProvider implements MessagingProvider {
  private accessToken: string;
  private phoneNumberId: string;
  private graphApiVersion: string = 'v18.0';

  constructor(accessToken?: string, phoneNumberId?: string) {
    this.accessToken = accessToken || process.env.META_ACCESS_TOKEN || '';
    this.phoneNumberId = phoneNumberId || process.env.META_PHONE_NUMBER_ID || '';

    if (!this.accessToken) {
      console.warn('⚠️ Meta Access Token not configured. Set META_ACCESS_TOKEN env variable.');
    }
    if (!this.phoneNumberId) {
      console.warn('⚠️ Meta Phone Number ID not configured. Set META_PHONE_NUMBER_ID env variable.');
    }
  }

  getProviderName(): string {
    return 'meta';
  }

  async createInstance(
    tenantId: string,
    instanceName: string,
    webhookUrl?: string
  ): Promise<CreateInstanceResult> {
    // Meta doesn't use "instances" - it uses pre-registered phone numbers
    // This method would typically:
    // 1. Register a webhook for this tenant
    // 2. Map tenant to a phone number ID
    // 3. Store the mapping in your database

    console.log(`📱 Meta Provider: Creating instance for tenant ${tenantId}`);

    // For now, return a mock result
    return {
      instanceId: `meta_${tenantId}_${nanoid(8)}`,
      status: 'connected', // Meta instances are always "connected" if phone is verified
      qrCode: undefined, // Meta doesn't use QR codes
      metadata: {
        phoneNumberId: this.phoneNumberId,
        provider: 'meta',
        note: 'Meta WhatsApp Cloud API uses pre-verified business phone numbers'
      }
    };
  }

  async getConnectionStatus(instanceId: string): Promise<ConnectionStatus> {
    // Meta phone numbers are always "connected" if they're verified
    // You would query Meta's API to verify phone number status

    if (!this.accessToken || !this.phoneNumberId) {
      return {
        status: 'error',
        details: 'Meta provider not configured. Missing access token or phone number ID.'
      };
    }

    // TODO: Implement actual Meta API call to verify phone number status
    // Example: GET https://graph.facebook.com/v18.0/{phone-number-id}

    return {
      status: 'connected',
      details: 'Meta phone number is verified and active',
      lastSeen: Date.now()
    };
  }

  async getQRCode(instanceId: string): Promise<string | null> {
    // Meta doesn't use QR codes for authentication
    return null;
  }

  async sendMessage(
    instanceId: string,
    to: string,
    message: string
  ): Promise<SendMessageResult> {
    if (!this.accessToken || !this.phoneNumberId) {
      return {
        messageId: `failed_${nanoid(16)}`,
        success: false,
        timestamp: Date.now(),
        error: 'Meta provider not configured'
      };
    }

    try {
      // Meta WhatsApp Cloud API endpoint
      const url = `https://graph.facebook.com/${this.graphApiVersion}/${this.phoneNumberId}/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.replace('+', ''), // Meta expects number without +
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          messageId: `failed_${nanoid(16)}`,
          success: false,
          timestamp: Date.now(),
          error: `Meta API Error: ${JSON.stringify(errorData)}`
        };
      }

      const data = await response.json();

      return {
        messageId: data.messages?.[0]?.id || `msg_${nanoid(16)}`,
        success: true,
        timestamp: Date.now()
      };
    } catch (error: any) {
      return {
        messageId: `failed_${nanoid(16)}`,
        success: false,
        timestamp: Date.now(),
        error: error.message || 'Unknown error'
      };
    }
  }

  async deleteInstance(instanceId: string): Promise<boolean> {
    // Meta doesn't have a concept of "deleting" an instance
    // You would typically just remove the webhook or tenant mapping
    console.log(`📱 Meta Provider: Removing instance ${instanceId} (webhook unregistered)`);
    return true;
  }

  /**
   * Helper method to send a template message (required for first contact in Meta)
   * Template messages must be pre-approved by Meta
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en_US',
    components?: any[]
  ): Promise<SendMessageResult> {
    if (!this.accessToken || !this.phoneNumberId) {
      return {
        messageId: `failed_${nanoid(16)}`,
        success: false,
        timestamp: Date.now(),
        error: 'Meta provider not configured'
      };
    }

    try {
      const url = `https://graph.facebook.com/${this.graphApiVersion}/${this.phoneNumberId}/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.replace('+', ''),
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: languageCode
            },
            ...(components && { components })
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          messageId: `failed_${nanoid(16)}`,
          success: false,
          timestamp: Date.now(),
          error: `Meta API Error: ${JSON.stringify(errorData)}`
        };
      }

      const data = await response.json();

      return {
        messageId: data.messages?.[0]?.id || `msg_${nanoid(16)}`,
        success: true,
        timestamp: Date.now()
      };
    } catch (error: any) {
      return {
        messageId: `failed_${nanoid(16)}`,
        success: false,
        timestamp: Date.now(),
        error: error.message || 'Unknown error'
      };
    }
  }
}
