import { useState } from 'react';
import { api } from '../api/client';
import type { Instance } from '../types';

interface Props {
  onInstanceCreated: (instance: Instance) => void;
}

export function CreateInstance({ onInstanceCreated }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const instance = await api.createInstance(name);
      onInstanceCreated(instance);
      setName('');
    } catch (err: any) {
      setError(err.message || 'Error al crear instancia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-black p-5 mb-5">
      <h2 className="text-xl font-bold mb-4">1. Crear Instancia</h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de instancia"
          disabled={loading}
          className="px-3 py-2 border border-black w-52 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-4 py-2 border border-black bg-white hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear'}
        </button>
      </form>
      {error && <p className="text-red-600 mt-3">{error}</p>}
    </div>
  );
}
