import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { Instance, QRCodeResponse } from '../types';

interface Props {
  instance: Instance;
  onConnected: () => void;
}

export function ShowQR({ instance, onConnected }: Props) {
  const [qr, setQr] = useState<QRCodeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);

  const fetchQR = async () => {
    setLoading(true);
    setError('');
    try {
      const qrData = await api.getQRCode(instance.id);
      setQr(qrData);
      setPolling(true);
    } catch (err: any) {
      setError(err.message || 'Error al obtener QR');
    } finally {
      setLoading(false);
    }
  };

  // Poll instance status
  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      try {
        const updated = await api.getInstance(instance.id);
        if (updated.status === 'connected') {
          setPolling(false);
          onConnected();
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [polling, instance.id, onConnected]);

  if (instance.status === 'connected') {
    return (
      <div className="border border-black p-5 mb-5 bg-gray-200">
        <h2 className="text-xl font-bold mb-4">2. Estado: ✓ Conectado</h2>
        <p className="mb-2">Instancia: <strong>{instance.name}</strong></p>
        <p>Estado: <strong>Conectado</strong></p>
      </div>
    );
  }

  return (
    <div className="border border-black p-5 mb-5">
      <h2 className="text-xl font-bold mb-4">2. Escanear QR Code</h2>
      <p className="mb-2">Instancia: <strong>{instance.name}</strong></p>
      <p className="mb-4">Estado: <strong>{instance.status}</strong></p>

      {!qr && !loading && (
        <button
          onClick={fetchQR}
          className="px-4 py-2 border border-black bg-white hover:bg-gray-100 mt-2"
        >
          Mostrar QR
        </button>
      )}

      {loading && <p className="mt-4">Cargando QR...</p>}

      {qr && (
        <div className="mt-5">
          <img
            src={qr.qr_code}
            alt="QR Code"
            className="border border-black max-w-xs"
          />
          <p className="text-xs mt-3">
            {polling ? '⏳ Esperando escaneo... (refrescando automáticamente)' : `Expira en ${qr.expires_in}s`}
          </p>
          {!polling && (
            <button
              onClick={fetchQR}
              className="px-4 py-2 border border-black bg-white hover:bg-gray-100 mt-3"
            >
              Refrescar QR
            </button>
          )}
        </div>
      )}

      {error && <p className="text-red-600 mt-3">{error}</p>}
    </div>
  );
}
