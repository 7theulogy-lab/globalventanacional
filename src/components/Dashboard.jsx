import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Plus, ChevronRight, Trash2 } from 'lucide-react';

export default function Dashboard({ onSelectVenta }) {
  const [ventas, setVentas] = useLocalStorage('venta_nacional_list', []);
  const [newVentaName, setNewVentaName] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newVentaName.trim()) return;
    const newVenta = {
      id: Date.now().toString(),
      name: newVentaName.trim(),
      date: new Date().toLocaleDateString()
    };
    setVentas([newVenta, ...ventas]);
    setNewVentaName('');
    onSelectVenta(newVenta);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('¿Seguro que deseas eliminar este registro?')) {
      setVentas(ventas.filter(v => v.id !== id));
      localStorage.removeItem(`venta_items_${id}`);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <header className="mb-6 pt-4 text-center">
        <h1 className="text-2xl font-bold text-blue-600">Venta Nacional</h1>
        <p className="text-sm text-gray-500">Gestión manual de códigos</p>
      </header>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Ej: Pedido Falabella #123"
          className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 font-medium"
          value={newVentaName}
          onChange={(e) => setNewVentaName(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700">
          <Plus size={24} />
        </button>
      </form>

      <div className="space-y-3">
        {ventas.map(venta => (
          <div 
            key={venta.id}
            onClick={() => onSelectVenta(venta)}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 active:scale-95 transition-transform"
          >
            <div>
              <h3 className="font-bold text-gray-800">{venta.name}</h3>
              <p className="text-xs text-gray-500">{venta.date}</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={(e) => handleDelete(venta.id, e)}
                className="text-red-400 p-2 hover:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 size={20} />
              </button>
              <ChevronRight className="text-gray-400" size={24} />
            </div>
          </div>
        ))}
        
        {ventas.length === 0 && (
          <p className="text-center text-gray-400 mt-10">No hay ventas creadas.</p>
        )}
      </div>
    </div>
  );
}
