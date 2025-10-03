const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8200';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

/**
 * WebSocket Singleton Service (Native WebSocket for AWS API Gateway)
 * Prevents multiple connections in React StrictMode
 */
class WebSocketService {
  private static instance: WebSocketService | null = null;
  private ws: WebSocket | null = null;
  private currentTenantId: string | null = null;
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(tenantId: string): void {
    // If already connected to the same tenant, return
    if (this.ws?.readyState === WebSocket.OPEN && this.currentTenantId === tenantId) {
      console.log('♻️ Reusing existing WebSocket connection');
      return;
    }

    // If connected to different tenant, disconnect first
    if (this.ws && this.currentTenantId !== tenantId) {
      console.log('🔄 Switching tenant, disconnecting old connection');
      this.disconnect();
    }

    // Create new connection
    console.log('🔌 Creating new WebSocket connection to:', WS_URL);
    this.ws = new WebSocket(WS_URL);
    this.currentTenantId = tenantId;

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;

      // Subscribe to tenant immediately (WebSocket is ready in onopen)
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          action: 'subscribe',
          tenantId
        }));
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 WebSocket message:', message);

        // Emit to registered handlers
        const handlers = this.eventHandlers.get(message.type);
        if (handlers) {
          handlers.forEach(handler => handler(message));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');

      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => {
          if (this.currentTenantId) {
            this.connect(this.currentTenantId);
          }
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
  }

  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  send(data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not open, cannot send:', data);
    }
  }

  disconnect(): void {
    if (this.ws) {
      console.log('🔌 Disconnecting WebSocket');
      this.ws.close();
      this.ws = null;
      this.currentTenantId = null;
      this.reconnectAttempts = 0;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = WebSocketService.getInstance();
