export interface Instance {
  id: string;
  name: string;
  evolution_instance_name: string;
  status: 'creating' | 'waiting_qr' | 'connected' | 'disconnected' | 'error';
  created_at: string;
  connected_at?: string;
  webhook_url?: string;
}

export interface QRCodeResponse {
  qr_code: string; // base64 image
  status: string;
  expires_in: number;
}

export interface MessageRequest {
  instance_id: string;
  to: string;
  message: string;
}

export interface MessageResponse {
  id: string;
  status: 'sent' | 'failed';
  timestamp: number;
  instance_id: string;
  to: string;
  error?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
