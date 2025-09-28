import axios, { AxiosInstance, AxiosError } from 'axios';

interface CreateInstanceParams {
  instanceName: string;
  webhook: {
    url: string;
    headers?: Record<string, string>;
  };
}

interface SendTextParams {
  instanceName: string;
  to: string;
  body: string;
}

export class EvolutionClient {
  private client: AxiosInstance;

  constructor(baseUrl: string, apiKey?: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
      },
    });
  }

  async createInstance(params: CreateInstanceParams): Promise<any> {
    try {
      const response = await this.client.post('/instance/create', {
        instanceName: params.instanceName,
        webhook: params.webhook.url,
        webhook_by_events: false,
        webhook_base64: false,
        events: [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'MESSAGES_DELETE',
          'SEND_MESSAGE',
          'CONTACTS_SET',
          'CONTACTS_UPSERT',
          'CONTACTS_UPDATE',
          'PRESENCE_UPDATE',
          'CHATS_SET',
          'CHATS_UPSERT',
          'CHATS_UPDATE',
          'CHATS_DELETE',
          'GROUPS_UPSERT',
          'GROUP_UPDATE',
          'GROUP_PARTICIPANTS_UPDATE',
          'CONNECTION_UPDATE',
          'CALL',
          'NEW_JWT_TOKEN'
        ],
        ...(params.webhook.headers && { webhook_headers: params.webhook.headers }),
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const customError = new Error(`Evolution API Error: ${axiosError.message}`) as any;
        customError.status = axiosError.response?.status;
        customError.data = axiosError.response?.data;
        throw customError;
      }
      throw error;
    }
  }

  async getInstance(instanceName: string): Promise<any> {
    try {
      const response = await this.client.get(`/instance/connectionState/${instanceName}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const customError = new Error(`Evolution API Error: ${axiosError.message}`) as any;
        customError.status = axiosError.response?.status;
        customError.data = axiosError.response?.data;
        throw customError;
      }
      throw error;
    }
  }

  async sendText(params: SendTextParams): Promise<any> {
    try {
      const response = await this.client.post(`/instances/${params.instanceName}/messages/text`, {
        to: params.to,
        body: params.body,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const customError = new Error(`Evolution API Error: ${axiosError.message}`) as any;
        customError.status = axiosError.response?.status;
        customError.data = axiosError.response?.data;
        throw customError;
      }
      throw error;
    }
  }
}