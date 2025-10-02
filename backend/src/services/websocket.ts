import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private static instance: WebSocketService;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 WebSocket client connected: ${socket.id}`);

      socket.on('subscribe', (data: { tenantId: string }) => {
        const room = `tenant:${data.tenantId}`;
        socket.join(room);
        console.log(`✅ Client ${socket.id} subscribed to ${room}`);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
      });
    });

    console.log('✅ WebSocket server initialized');
  }

  // Emit instance status update to all clients subscribed to tenant
  emitInstanceUpdate(tenantId: string, instanceId: string, data: any): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket not initialized');
      return;
    }

    const room = `tenant:${tenantId}`;
    this.io.to(room).emit('instance:update', {
      instanceId,
      ...data
    });

    console.log(`📡 Emitted instance update to ${room}:`, { instanceId, ...data });
  }

  // Emit QR code ready event
  emitQRReady(tenantId: string, instanceId: string, qrCode: string): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket not initialized');
      return;
    }

    const room = `tenant:${tenantId}`;
    this.io.to(room).emit('qr:ready', {
      instanceId,
      qrCode
    });

    console.log(`📡 Emitted QR ready to ${room}: ${instanceId}`);
  }

  // Emit connection status change
  emitConnectionStatus(tenantId: string, instanceId: string, status: string): void {
    if (!this.io) {
      console.warn('⚠️ WebSocket not initialized');
      return;
    }

    const room = `tenant:${tenantId}`;
    this.io.to(room).emit('connection:status', {
      instanceId,
      status
    });

    console.log(`📡 Emitted connection status to ${room}: ${instanceId} - ${status}`);
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}
