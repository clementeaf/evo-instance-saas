import { useEffect, useRef } from 'react';
import { websocketService } from '../services/websocket';

interface WebSocketEvents {
  onQRReady?: (data: { instanceId: string; qrCode: string }) => void;
  onConnectionStatus?: (data: { instanceId: string; status: string }) => void;
  onInstanceUpdate?: (data: { instanceId: string; [key: string]: any }) => void;
}

export const useWebSocket = (tenantId: string, events: WebSocketEvents) => {
  const eventsRef = useRef<WebSocketEvents>(events);
  const handlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  // Keep events ref updated
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    // Connect using singleton service
    websocketService.connect(tenantId);

    // Create event handlers
    const qrHandler = (data: any) => {
      eventsRef.current.onQRReady?.({ instanceId: data.instanceId, qrCode: data.qrCode });
    };

    const statusHandler = (data: any) => {
      eventsRef.current.onConnectionStatus?.({ instanceId: data.instanceId, status: data.status });
    };

    const updateHandler = (data: any) => {
      eventsRef.current.onInstanceUpdate?.(data);
    };

    // Register handlers
    websocketService.on('qr:ready', qrHandler);
    websocketService.on('connection:status', statusHandler);
    websocketService.on('instance:update', updateHandler);

    // Store handlers for cleanup
    handlersRef.current.set('qr:ready', qrHandler);
    handlersRef.current.set('connection:status', statusHandler);
    handlersRef.current.set('instance:update', updateHandler);

    // Cleanup on unmount
    return () => {
      handlersRef.current.forEach((handler, event) => {
        websocketService.off(event, handler);
      });
      handlersRef.current.clear();
    };
  }, [tenantId]);

  return websocketService;
};
