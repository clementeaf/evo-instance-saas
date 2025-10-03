import { useState, useEffect } from 'react';
import { CreateInstance } from './components/CreateInstance';
import { api } from './api/client';
import type { Instance } from './types';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [loadingQR, setLoadingQR] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // WebSocket for real-time updates (using test tenant)
  useWebSocket('test-tenant', {
    onQRReady: ({ instanceId, qrCode }) => {
      console.log('📡 QR Ready received:', instanceId);
      setQrCodes(prev => ({ ...prev, [instanceId]: qrCode }));
      setLoadingQR(prev => ({ ...prev, [instanceId]: false }));
    },
    onConnectionStatus: ({ instanceId, status }) => {
      console.log('📡 Connection status received:', instanceId, status);
      setInstances(prev => prev.map(i =>
        i.id === instanceId ? { ...i, status: status as Instance['status'] } : i
      ));

      // Remove QR code when connected
      if (status === 'connected') {
        setQrCodes(prev => {
          const newQrCodes = { ...prev };
          delete newQrCodes[instanceId];
          return newQrCodes;
        });
      }
    }
  });

  // Load instances on mount
  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    setLoading(true);
    try {
      const data = await api.getInstances();
      setInstances(data);
    } catch (err) {
      console.error('Error loading instances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInstanceCreated = (instance: Instance) => {
    setInstances([...instances, instance]);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta instancia?')) return;

    try {
      await api.deleteInstance(instanceId);
      setInstances(instances.filter(i => i.id !== instanceId));
      // Remove QR from state
      const newQrCodes = { ...qrCodes };
      delete newQrCodes[instanceId];
      setQrCodes(newQrCodes);
    } catch (err) {
      console.error('Error deleting instance:', err);
      alert('Error al eliminar la instancia');
    }
  };

  const handleShowQR = async (instanceId: string) => {
    setLoadingQR({ ...loadingQR, [instanceId]: true });
    try {
      const qrData = await api.getQRCode(instanceId);
      setQrCodes({ ...qrCodes, [instanceId]: qrData.qr_code });
      setLoadingQR({ ...loadingQR, [instanceId]: false });

      // WebSocket will notify us when connected via 'connection:status' event
    } catch (err: any) {
      alert(err.message || 'Error al obtener QR');
      setLoadingQR({ ...loadingQR, [instanceId]: false });
    }
  };


  const handleSendMessage = async (instanceId: string) => {
    const to = prompt('Número con código país (ej: +1234567890):');
    if (!to) return;

    const message = prompt('Mensaje:');
    if (!message) return;

    const instance = instances.find(i => i.id === instanceId);
    if (!instance) return;

    try {
      await api.sendMessage({
        instance_id: instance.evolution_instance_name,
        to: to.trim(),
        message: message.trim(),
      });
      alert('✓ Mensaje enviado');
    } catch (err: any) {
      alert(err.message || 'Error al enviar mensaje');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === instances.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(instances.map(i => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`¿Estás seguro de eliminar ${selectedIds.size} instancia(s)?`)) return;

    try {
      await Promise.all([...selectedIds].map(id => api.deleteInstance(id)));
      setInstances(instances.filter(i => !selectedIds.has(i.id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Error deleting instances:', err);
      alert('Error al eliminar instancias');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-5 font-mono bg-white min-h-screen">
      <h1 className="text-3xl font-bold border-b-2 border-black pb-3 mb-8">
        WhatsApp Instance Manager
      </h1>

      {/* Create new instance */}
      <div className="mb-8">
        <CreateInstance onInstanceCreated={handleInstanceCreated} />
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 border border-black bg-gray-50 flex justify-between items-center">
          <span>{selectedIds.size} instancia(s) seleccionada(s)</span>
          <button
            onClick={handleDeleteSelected}
            className="px-4 py-2 border border-black bg-red-50 hover:bg-red-100"
          >
            Eliminar seleccionadas
          </button>
        </div>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : instances.length === 0 ? (
        <div className="border border-black p-5 bg-gray-100">
          <p>No hay instancias. Crea una arriba para comenzar.</p>
        </div>
      ) : (
        <div className="border border-black">
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="border-b border-black p-3 text-center w-12">
                  <input
                    type="checkbox"
                    checked={instances.length > 0 && selectedIds.size === instances.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="border-b border-black p-3 text-left">Nombre</th>
                <th className="border-b border-black p-3 text-left">Estado</th>
                <th className="border-b border-black p-3 text-left">QR Code</th>
                <th className="border-b border-black p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((instance, idx) => (
                <tr key={instance.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border-b border-gray-300 p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(instance.id)}
                      onChange={() => toggleSelect(instance.id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="border-b border-gray-300 p-3">{instance.name}</td>
                  <td className="border-b border-gray-300 p-3">
                    <span className={`px-2 py-1 text-xs ${
                      instance.status === 'connected' ? 'bg-green-100 text-green-800' :
                      instance.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {instance.status === 'waiting_qr' && qrCodes[instance.id]
                        ? 'Escanea el QR'
                        : instance.status === 'waiting_qr'
                        ? 'Lista para conectar'
                        : instance.status === 'connected'
                        ? 'Conectada'
                        : instance.status === 'error'
                        ? 'Error'
                        : instance.status}
                    </span>
                  </td>
                  <td className="border-b border-gray-300 p-3">
                    {instance.status === 'connected' ? (
                      <span className="text-green-600">✓ Conectado</span>
                    ) : loadingQR[instance.id] ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                        <span className="text-sm">Generando QR...</span>
                      </div>
                    ) : qrCodes[instance.id] ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={qrCodes[instance.id]} alt="QR" className="w-32 h-32" />
                        <span className="text-xs text-gray-600 animate-pulse">⏳ Esperando conexión...</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleShowQR(instance.id)}
                        className="px-3 py-1 border border-black bg-white hover:bg-gray-100"
                      >
                        Mostrar QR
                      </button>
                    )}
                  </td>
                  <td className="border-b border-gray-300 p-3">
                    <div className="flex gap-2">
                      {instance.status === 'connected' && (
                        <button
                          onClick={() => handleSendMessage(instance.id)}
                          className="px-3 py-1 border border-black bg-blue-50 hover:bg-blue-100"
                        >
                          Enviar
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteInstance(instance.id)}
                        className="px-3 py-1 border border-black bg-red-50 hover:bg-red-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

export default App;
