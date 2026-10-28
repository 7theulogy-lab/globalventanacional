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

  const [itemToDelete, setItemToDelete] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);

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
    <div className="min-h-screen bg-gray-200 flex justify-center sm:items-center sm:p-6 font-sans">
      <div className="w-full max-w-[420px] bg-global-bg min-h-screen sm:min-h-0 sm:h-[800px] sm:rounded-[2rem] sm:shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors text-global-navy">
              <ArrowLeft size={22} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-[16px] font-bold text-global-navy leading-tight truncate max-w-[180px]">{venta.name}</h2>
              <p className="text-[11px] text-global-teal font-semibold">{items.length} Filas | {totalItems} Unds.</p>
            </div>
          </div>
          <button 
            onClick={copyToExcel}
            className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-2 rounded-lg font-bold hover:bg-green-100 active:scale-95 transition-transform"
          >
            <Copy size={16} />
            <span className="text-[13px]">Excel</span>
          </button>
        </header>

        <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
          {/* FORMULARIO INGRESO */}
          <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-gray-100 flex gap-2 items-end shrink-0">
            <div className="flex-1">
              <label className="block text-[12px] font-bold text-global-navy mb-1.5">Código</label>
              <input 
                ref={codigoInputRef}
                type="text" 
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg text-global-navy focus:outline-none focus:border-global-teal focus:ring-1 focus:ring-global-teal uppercase font-mono font-bold text-sm placeholder-gray-400"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: IP8194"
              />
            </div>
            <div className="w-[85px]">
              <label className="block text-[12px] font-bold text-global-navy mb-1.5 text-center">Cant.</label>
              <input 
                type="number" 
                min="1"
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg text-global-navy focus:outline-none focus:border-global-teal focus:ring-1 focus:ring-global-teal text-center font-bold text-sm placeholder-gray-400"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="0"
              />
            </div>
            <button 
              type="submit" 
              className="bg-global-teal text-white p-3.5 rounded-lg hover:bg-[#528C96] active:scale-95 transition-transform flex items-center justify-center shadow-sm"
            >
              <Plus size={18} />
            </button>
          </form>

          {/* BUSCADOR */}
          <div className="relative shrink-0">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar código en la lista..."
              className="w-full bg-white border border-gray-200 p-3.5 pl-10 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] text-global-navy focus:outline-none focus:border-global-teal focus:ring-1 focus:ring-global-teal text-[13px] font-medium placeholder-gray-400 transition-shadow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* LISTADO */}
          <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-gray-100 flex-1 flex flex-col overflow-hidden">
            <div className="grid grid-cols-[1fr_70px_80px] gap-2 p-3 bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-global-text uppercase tracking-wide">
              <div className="pl-1">Código</div>
              <div className="text-center">Cant.</div>
              <div className="text-center">Acción</div>
            </div>
            
            <div className="overflow-y-auto pb-6 flex-1">
              {filteredItems.map(item => (
                <div key={item.id} className="border-b border-gray-50 last:border-0">
                  {editingId === item.id ? (
                    <form onSubmit={saveEdit} className="grid grid-cols-[1fr_70px_80px] gap-2 p-2 bg-blue-50/50 items-center border-l-[3px] border-global-teal">
                      <input 
                        ref={editCodigoRef}
                        type="text" 
                        className="border border-blue-200 p-2 rounded-lg font-mono text-[13px] bg-white text-global-navy w-full focus:outline-none focus:border-global-teal font-bold uppercase"
                        value={editCodigo}
                        onChange={(e) => setEditCodigo(e.target.value.toUpperCase())}
                      />
                      <input 
                        type="number"
                        min="1"
                        className="border border-blue-200 p-2 rounded-lg text-center text-[13px] font-bold bg-white text-global-navy w-full focus:outline-none focus:border-global-teal"
                        value={editCantidad}
                        onChange={(e) => setEditCantidad(e.target.value)}
                      />
                      <div className="flex items-center justify-center gap-1.5">
                        <button type="submit" className="text-white bg-global-teal p-2 rounded-lg hover:bg-[#528C96] shadow-sm">
                          <Save size={15} />
                        </button>
                        <button type="button" onClick={cancelEdit} className="text-gray-500 bg-gray-200 p-2 rounded-lg hover:bg-gray-300">
                          <X size={15} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-[1fr_70px_80px] gap-2 p-3.5 items-center hover:bg-gray-50/50 transition-colors">
                      <div className="font-mono font-bold text-global-navy truncate pl-1 text-[14px]">{item.codigo}</div>
                      <div className="text-center font-bold text-global-teal bg-teal-50 py-1 px-2 rounded-md text-[13px] border border-teal-100">
                        {item.cantidad}
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(item)} className="text-global-teal hover:bg-teal-50 p-2 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setItemToDelete(item.id)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors">
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {filteredItems.length === 0 && (
                <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-3">
                  <Search size={32} className="opacity-20" />
                  <span className="text-[13px] font-medium text-global-text">
                    {searchQuery ? 'Código no encontrado.' : 'Ingresa tu primer producto.'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL BORRAR FILA */}
        {itemToDelete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-global-navy/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-[300px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="p-6 text-center flex flex-col items-center gap-3">
                <div className="bg-red-50 p-3.5 rounded-full text-red-500 mb-1">
                  <Trash size={32} />
                </div>
                <h3 className="text-[18px] font-bold text-global-navy">¿Borrar código?</h3>
                <p className="text-[13px] text-global-text">Esta fila será eliminada de tu lista.</p>
              </div>
              <div className="flex border-t border-gray-100 bg-gray-50">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-4 text-[14px] text-global-text font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <div className="w-px bg-gray-200"></div>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 text-[14px] text-red-500 font-bold hover:bg-red-50 transition-colors"
                >
                  Borrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ALERTA EXCEL */}
        {alertInfo && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-global-navy/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-[300px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="p-6 text-center flex flex-col items-center gap-3">
                {alertInfo.type === 'success' ? (
                  <div className="bg-green-50 p-3.5 rounded-full text-green-500 mb-1">
                    <CheckCircle2 size={32} />
                  </div>
                ) : (
                  <div className="bg-red-50 p-3.5 rounded-full text-red-500 mb-1">
                    <AlertCircle size={32} />
                  </div>
                )}
                <h3 className="text-[18px] font-bold text-global-navy">
                  {alertInfo.type === 'success' ? '¡Éxito!' : 'Error'}
                </h3>
                <p className="text-[13px] text-global-text">{alertInfo.msg}</p>
              </div>
              <div className="flex border-t border-gray-100 bg-gray-50">
                <button 
                  onClick={() => setAlertInfo(null)}
                  className="flex-1 py-4 text-[14px] text-global-teal font-bold hover:bg-gray-100 transition-colors"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}