import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8200';

interface WebSocketEvents {
  onQRReady?: (data: { instanceId: string; qrCode: string }) => void;
  onConnectionStatus?: (data: { instanceId: string; status: string }) => void;
  onInstanceUpdate?: (data: { instanceId: string; [key: string]: any }) => void;
}

export const useWebSocket = (tenantId: string, events: WebSocketEvents) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      // Subscribe to tenant updates
      socket.emit('subscribe', { tenantId });
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });

    // Event listeners
    if (events.onQRReady) {
      socket.on('qr:ready', events.onQRReady);
    }

    if (events.onConnectionStatus) {
      socket.on('connection:status', events.onConnectionStatus);
    }

    if (events.onInstanceUpdate) {
      socket.on('instance:update', events.onInstanceUpdate);
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [tenantId, events.onQRReady, events.onConnectionStatus, events.onInstanceUpdate]);

  return socketRef.current;
};
