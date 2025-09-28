import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

export class EvolutionAPIService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.evolutionApi.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.evolutionApi.token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async sendMessage(instanceName: string, data: any): Promise<any> {
    try {
      const response = await this.client.post(`/message/sendText/${instanceName}`, data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending message via Evolution API:', error);
      throw error;
    }
  }

  async getInstanceInfo(instanceName: string): Promise<any> {
    try {
      const response = await this.client.get(`/instance/connectionState/${instanceName}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting instance info:', error);
      throw error;
    }
  }
}