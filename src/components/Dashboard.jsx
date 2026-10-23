import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Plus, ChevronRight, Trash2, AlertTriangle } from 'lucide-react';

export default function Dashboard({ onSelectVenta }) {
  const [ventas, setVentas] = useLocalStorage('venta_nacional_list', []);
  const [newVentaName, setNewVentaName] = useState('');
  
  // Estado para el modal de eliminación
  const [ventaToDelete, setVentaToDelete] = useState(null);

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

  const handleDeleteClick = (id, e) => {
    e.stopPropagation(); // Evita que se abra la venta al hacer click en el basurero
    setVentaToDelete(id);
  };

  const confirmDelete = () => {
    if (ventaToDelete) {
      setVentas(ventas.filter(v => v.id !== ventaToDelete));
      localStorage.removeItem(`venta_items_${ventaToDelete}`);
      setVentaToDelete(null);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-gray-900 min-h-screen text-gray-100 relative">
      <header className="mb-6 pt-4 text-center">
        <h1 className="text-2xl font-bold text-blue-400">Venta Nacional</h1>
        <p className="text-sm text-gray-400">Gestión manual de códigos</p>
      </header>

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Ej: Pedido Falabella #123"
          className="flex-1 p-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:outline-none focus:border-blue-500 font-medium placeholder-gray-500"
          value={newVentaName}
          onChange={(e) => setNewVentaName(e.target.value.toUpperCase())}
        />
        <button type="submit" className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 active:scale-95 transition-transform">
          <Plus size={24} />
        </button>
      </form>

      <div className="space-y-3">
        {ventas.map(venta => (
          <div 
            key={venta.id}
            onClick={() => onSelectVenta(venta)}
            className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-750 hover:border-gray-600 active:scale-95 transition-all"
          >
            <div>
              <h3 className="font-bold text-gray-100">{venta.name}</h3>
              <p className="text-xs text-gray-400">{venta.date}</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={(e) => handleDeleteClick(venta.id, e)}
                className="text-red-400 p-2 hover:bg-red-900/30 rounded-full transition-colors"
              >
                <Trash2 size={20} />
              </button>
              <ChevronRight className="text-gray-500" size={24} />
            </div>
          </div>
        ))}
        
        {ventas.length === 0 && (
          <p className="text-center text-gray-500 mt-10">No hay ventas creadas.</p>
        )}
      </div>

      {/* MODAL CONFIRMACIÓN DE ELIMINAR */}
      {ventaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl w-full max-w-sm border border-gray-700 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center flex flex-col items-center gap-3">
              <div className="bg-red-900/30 p-3 rounded-full text-red-500 mb-2">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">¿Eliminar registro?</h3>
              <p className="text-sm text-gray-400">Esta acción no se puede deshacer y borrará todos los códigos guardados en esta venta.</p>
            </div>
            <div className="flex border-t border-gray-700">
              <button 
                onClick={() => setVentaToDelete(null)}
                className="flex-1 py-4 text-gray-300 font-bold bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <div className="w-px bg-gray-700"></div>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-4 text-red-400 font-bold bg-gray-800 hover:bg-gray-700 hover:text-red-300 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
