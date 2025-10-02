import { useState } from 'react';
import { api } from '../api/client';
import type { Instance } from '../types';

interface Props {
  instance: Instance;
}

export function SendMessage({ instance }: Props) {
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !message.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await api.sendMessage({
        instance_id: instance.name,
        to: to.trim(),
        message: message.trim(),
      });
      setSuccess(`✓ Mensaje enviado (ID: ${result.id})`);
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Error al enviar mensaje');
    } finally {
      setLoading(false);
    }
  };

  if (instance.status !== 'connected') {
    return (
      <div className="border border-black p-5 bg-gray-100">
        <h2 className="text-xl font-bold mb-4">3. Enviar Mensaje</h2>
        <p className="text-gray-600">Primero conecta la instancia escaneando el QR</p>
      </div>
    );
  }

  return (
    <div className="border border-black p-5">
      <h2 className="text-xl font-bold mb-4">3. Enviar Mensaje de Prueba</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">
            Número (con código país, ej: +1234567890):
          </label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="+1234567890"
            disabled={loading}
            className="px-3 py-2 border border-black w-full max-w-sm disabled:bg-gray-100"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2">
            Mensaje:
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hola, este es un mensaje de prueba"
            disabled={loading}
            rows={3}
            className="px-3 py-2 border border-black w-full max-w-md font-mono disabled:bg-gray-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !to.trim() || !message.trim()}
          className="px-4 py-2 border border-black bg-white hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>

      {error && <p className="text-red-600 mt-3">{error}</p>}
      {success && <p className="text-green-600 mt-3">{success}</p>}
    </div>
  );
}
