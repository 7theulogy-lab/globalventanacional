import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, Edit2, Copy, Save, X, Plus, Trash, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';
import { playSuccessSound } from '../utils/audio';

export default function VentaView({ venta, onBack }) {
  const [items, setItems] = useLocalStorage(`venta_items_${venta.id}`, []);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [codigo, setCodigo] = useState('');
  const [cantidad, setCantidad] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [editCodigo, setEditCodigo] = useState('');
  const [editCantidad, setEditCantidad] = useState('');

  // Estados para Modales Custom
  const [itemToDelete, setItemToDelete] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null); // { type: 'success'|'error', msg: string }

  const codigoInputRef = useRef(null);
  const editCodigoRef = useRef(null);

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state?.screen === 'venta') {
        setEditingId(null);
        setItemToDelete(null);
        setAlertInfo(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    // Si no hay modales abiertos, mantener el foco
    if (!editingId && !itemToDelete && !alertInfo) {
      setTimeout(() => codigoInputRef.current?.focus(), 50);
    } else if (editingId) {
      setTimeout(() => editCodigoRef.current?.focus(), 50);
    }
  }, [editingId, itemToDelete, alertInfo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!codigo.trim() || !cantidad) return;
    
    const cleanCodigo = codigo.trim().toUpperCase();
    const numCantidad = parseInt(cantidad, 10) || 0;

    const existingIndex = items.findIndex(item => item.codigo === cleanCodigo);

    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].cantidad += numCantidad;
      setItems(newItems);
    } else {
      setItems([{ id: Date.now().toString(), codigo: cleanCodigo, cantidad: numCantidad }, ...items]);
    }

    playSuccessSound();
    setCodigo('');
    setCantidad('');
  };

  const handleEdit = (item) => {
    window.history.pushState({ screen: 'edit' }, '');
    setEditingId(item.id);
    setEditCodigo(item.codigo);
    setEditCantidad(item.cantidad);
  };

  const cancelEdit = () => {
    if (window.history.state?.screen === 'edit') {
      window.history.back();
    } else {
      setEditingId(null);
    }
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (!editCodigo.trim() || !editCantidad) return;
    
    const cleanCodigo = editCodigo.trim().toUpperCase();
    const numCantidad = parseInt(editCantidad, 10) || 0;
    
    setItems(items.map(item => 
      item.id === editingId ? { ...item, codigo: cleanCodigo, cantidad: numCantidad } : item
    ));
    
    playSuccessSound();
    cancelEdit();
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setItems(items.filter(item => item.id !== itemToDelete));
      setItemToDelete(null);
    }
  };

  const copyToExcel = () => {
    let text = "Código\tCantidad\n";
    items.forEach(item => {
      text += `${item.codigo}\t${item.cantidad}\n`;
    });
    
    navigator.clipboard.writeText(text)
      .then(() => setAlertInfo({ type: 'success', msg: 'Copiado al portapapeles con formato Excel. Listo para pegar.' }))
      .catch(() => setAlertInfo({ type: 'error', msg: 'Error al intentar copiar al portapapeles.' }));
  };

  const filteredItems = items.filter(item => 
    item.codigo.includes(searchQuery.toUpperCase())
  );

  const totalItems = items.reduce((acc, curr) => acc + curr.cantidad, 0);

  return (
    <div className="max-w-md mx-auto bg-gray-900 min-h-screen flex flex-col text-gray-100 relative">
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-700 transition-colors text-gray-300">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h2 className="font-bold text-gray-100 leading-tight truncate max-w-[180px]">{venta.name}</h2>
            <p className="text-xs text-blue-400 font-semibold">{items.length} Filas | {totalItems} Unds.</p>
          </div>
        </div>
        <button 
          onClick={copyToExcel}
          className="flex items-center gap-2 bg-green-900/40 text-green-400 border border-green-800/50 px-3 py-2 rounded-lg font-bold hover:bg-green-900/60 active:scale-95 transition-transform"
        >
          <Copy size={18} />
          <span className="text-sm">Excel</span>
        </button>
      </header>

      <div className="p-4 flex-1 flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-700 flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 mb-1">Código</label>
            <input 
              ref={codigoInputRef}
              type="text" 
              className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold placeholder-gray-600"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ej: IP8194"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-bold text-gray-400 mb-1">Cant.</label>
            <input 
              type="number" 
              min="1"
              className="w-full bg-gray-900 border border-gray-700 p-2.5 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold placeholder-gray-600"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="0"
            />
          </div>
          <button 
            type="submit" 
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 active:scale-95 transition-transform"
          >
            <Plus size={20} />
          </button>
        </form>

        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar código en la lista..."
            className="w-full bg-gray-800 border border-gray-700 p-3 pl-10 rounded-xl shadow-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium placeholder-gray-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-[1fr_70px_80px] gap-2 p-3 bg-gray-900 border-b border-gray-700 text-xs font-bold text-gray-400 uppercase">
            <div>Código</div>
            <div className="text-center">Cant.</div>
            <div className="text-center">Acción</div>
          </div>
          
          <div className="overflow-y-auto pb-10">
            {filteredItems.map(item => (
              <div key={item.id} className="border-b border-gray-700/50 last:border-0">
                {editingId === item.id ? (
                  <form onSubmit={saveEdit} className="grid grid-cols-[1fr_70px_80px] gap-2 p-2 bg-yellow-900/20 items-center border-l-4 border-yellow-500">
                    <input 
                      ref={editCodigoRef}
                      type="text" 
                      className="border border-yellow-700/50 p-1.5 rounded font-mono text-sm bg-gray-900 text-white w-full focus:outline-none focus:border-yellow-500"
                      value={editCodigo}
                      onChange={(e) => setEditCodigo(e.target.value.toUpperCase())}
                    />
                    <input 
                      type="number"
                      min="1"
                      className="border border-yellow-700/50 p-1.5 rounded text-center text-sm font-bold bg-gray-900 text-white w-full focus:outline-none focus:border-yellow-500"
                      value={editCantidad}
                      onChange={(e) => setEditCantidad(e.target.value)}
                    />
                    <div className="flex items-center justify-center gap-1">
                      <button type="submit" className="text-green-400 bg-green-900/30 p-1.5 rounded-lg hover:bg-green-900/60">
                        <Save size={16} />
                      </button>
                      <button type="button" onClick={cancelEdit} className="text-gray-400 bg-gray-700 p-1.5 rounded-lg hover:bg-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-[1fr_70px_80px] gap-2 p-3 items-center hover:bg-gray-700/50 transition-colors">
                    <div className="font-mono font-bold text-gray-200 truncate">{item.codigo}</div>
                    <div className="text-center font-bold text-blue-300 bg-blue-900/40 py-1 px-2 rounded-md">
                      {item.cantidad}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(item)} className="text-blue-400 hover:bg-blue-900/30 p-1.5 rounded-md transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setItemToDelete(item.id)} className="text-red-400 hover:bg-red-900/30 p-1.5 rounded-md transition-colors">
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {filteredItems.length === 0 && (
              <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-2">
                <Search size={32} className="opacity-20" />
                <span className="text-sm font-medium">
                  {searchQuery ? 'Código no encontrado.' : 'Ingresa tu primer producto.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL CONFIRMACIÓN DE ELIMINAR FILA */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl w-full max-w-xs border border-gray-700 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center flex flex-col items-center gap-3">
              <div className="bg-red-900/30 p-3 rounded-full text-red-500 mb-2">
                <Trash size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">¿Borrar código?</h3>
              <p className="text-sm text-gray-400">Esta fila será eliminada de tu lista actual.</p>
            </div>
            <div className="flex border-t border-gray-700">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-4 text-gray-300 font-bold bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <div className="w-px bg-gray-700"></div>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-4 text-red-400 font-bold bg-gray-800 hover:bg-gray-700 hover:text-red-300 transition-colors"
              >
                Borrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALERTA (EJ: EXCEL COPIADO) */}
      {alertInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl w-full max-w-xs border border-gray-700 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center flex flex-col items-center gap-3">
              {alertInfo.type === 'success' ? (
                <div className="bg-green-900/30 p-3 rounded-full text-green-500 mb-2">
                  <CheckCircle2 size={32} />
                </div>
              ) : (
                <div className="bg-red-900/30 p-3 rounded-full text-red-500 mb-2">
                  <AlertCircle size={32} />
                </div>
              )}
              <h3 className="text-lg font-bold text-white">
                {alertInfo.type === 'success' ? '¡Éxito!' : 'Error'}
              </h3>
              <p className="text-sm text-gray-400">{alertInfo.msg}</p>
            </div>
            <div className="flex border-t border-gray-700">
              <button 
                onClick={() => setAlertInfo(null)}
                className="flex-1 py-4 text-blue-400 font-bold bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
