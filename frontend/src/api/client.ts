import axios from 'axios';
import type { Instance, QRCodeResponse, MessageRequest, MessageResponse, APIResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Create instance
  createInstance: async (name: string): Promise<Instance> => {
    const response = await client.post<APIResponse<Instance>>('/api/v1/instances', { name });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create instance');
    }
    return response.data.data;
  },

  // Get instances
  getInstances: async (): Promise<Instance[]> => {
    const response = await client.get<APIResponse<{ instances: Instance[] }>>('/api/v1/instances');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch instances');
    }
    return response.data.data.instances;
  },

  // Get instance details
  getInstance: async (instanceId: string): Promise<Instance> => {
    const response = await client.get<APIResponse<Instance>>(`/api/v1/instances/${instanceId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch instance');
    }
    return response.data.data;
  },

  // Get QR code
  getQRCode: async (instanceId: string): Promise<QRCodeResponse> => {
    const response = await client.get<APIResponse<QRCodeResponse>>(`/api/v1/instances/${instanceId}/qr`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch QR code');
    }
    return response.data.data;
  },

  // Send message
  sendMessage: async (request: MessageRequest): Promise<MessageResponse> => {
    const response = await client.post<APIResponse<MessageResponse>>('/api/v1/messages/send', request);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to send message');
    }
    return response.data.data;
  },

  // Delete instance
  deleteInstance: async (instanceId: string): Promise<void> => {
    const response = await client.delete<APIResponse<null>>(`/api/v1/instances/${instanceId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete instance');
    }
  },
};
