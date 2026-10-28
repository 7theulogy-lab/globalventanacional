import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Plus, ChevronRight, Trash2, AlertTriangle, Building2, FolderOpen } from 'lucide-react';

export default function Dashboard({ onSelectVenta }) {
  const [ventas, setVentas] = useLocalStorage('venta_nacional_list', []);
  const [newVentaName, setNewVentaName] = useState('');
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
    e.stopPropagation();
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
    /* Contenedor principal: Centrado en PC, pantalla completa en PDA */
    <div className="min-h-screen bg-gray-200 flex justify-center sm:items-center sm:p-6 font-sans">
      
      {/* Marco de la aplicación (Simula móvil en Desktop) */}
      <div className="w-full max-w-[420px] bg-global-bg min-h-screen sm:min-h-0 sm:h-[800px] sm:rounded-[2rem] sm:shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* CABECERA DEGRADADA */}
        <div className="bg-gradient-to-r from-global-blue to-global-teal px-6 py-7 flex items-center gap-4 text-white shadow-sm shrink-0">
          <div className="w-16 h-16 bg-transparent rounded-full flex items-center justify-center border-[1.5px] border-white overflow-hidden shrink-0 relative">
            <div className="text-center leading-none mt-0.5">
               <span className="text-white font-semibold tracking-tight text-[11px]">global</span><span className="text-white font-light tracking-tight text-[11px]">market</span>
               <div className="text-white text-[5px] tracking-widest uppercase mt-0.5">Enterprise</div>
            </div>
          </div>
          <h1 className="text-[20px] font-normal tracking-wide text-white/95">Venta Nacional</h1>
        </div>

        {/* ÁREA DE CONTENIDO CON SCROLL */}
        <div className="px-5 pt-6 pb-12 flex-1 overflow-y-auto">
          {/* TÍTULOS */}
          <p className="text-[11px] text-global-text mb-1 uppercase tracking-wide">Gestión y consolidación</p>
          <h2 className="text-[32px] font-extrabold text-global-navy mb-2 tracking-tight leading-none">Control de Calidad</h2>
          <p className="text-[13px] text-global-text mb-5 leading-relaxed">Organizador de códigos, cantidades y exportador a excel</p>
          
          <div className="flex items-center gap-2 text-[13px] text-global-text mb-6">
            <Building2 size={16} className="text-global-text opacity-70" />
            <span>Centro de distribución · Renca</span>
          </div>

          {/* TARJETA UNIFICADA (FORMULARIO + ESTADO/LISTA) */}
          <div className="bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
            
            {/* SECCIÓN 1: FORMULARIO */}
            <div className="p-5">
              <h3 className="text-[16px] font-bold text-global-navy mb-1.5">Comienza con un pedido</h3>
              <p className="text-[13px] text-global-text mb-5 leading-relaxed">Asigna un nombre a la venta para identificarla durante el registro.</p>
              
              <form onSubmit={handleCreate}>
                <label className="block text-[13px] font-bold text-global-navy mb-2">Nombre del pedido</label>
                <input
                  type="text"
                  placeholder="Ingrese nombre"
                  className="w-full p-3.5 rounded-lg border border-gray-200 focus:outline-none focus:border-global-teal focus:ring-1 focus:ring-global-teal text-sm font-medium mb-4 placeholder-gray-400 transition-shadow"
                  value={newVentaName}
                  onChange={(e) => setNewVentaName(e.target.value.toUpperCase())}
                />
                <button 
                  type="submit" 
                  className="w-full bg-global-teal text-white py-3.5 rounded-lg font-medium hover:bg-[#528C96] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus size={18} />
                  Agregar
                </button>
              </form>
            </div>

            {/* SEPARADOR (HR) */}
            <div className="h-px bg-gray-100 w-full"></div>

            {/* SECCIÓN 2: ESTADO VACÍO O LISTADO */}
            {ventas.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                
                {/* ILUSTRACIÓN ESTADO VACÍO SVG */}
                <div className="w-[120px] h-[120px] bg-[#F2F8F9] rounded-full flex items-center justify-center mb-6 relative">
                  <svg width="60" height="70" viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -ml-3 -mt-3 opacity-90">
                    <rect x="5" y="5" width="40" height="50" rx="4" transform="rotate(-12 5 5)" fill="white" stroke="#006B83" strokeWidth="2"/>
                    <line x1="15" y1="20" x2="35" y2="16" stroke="#006B83" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="13" y1="30" x2="40" y2="25" stroke="#006B83" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="11" y1="40" x2="28" y2="37" stroke="#006B83" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  <svg width="55" height="45" viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute mt-8 ml-6 drop-shadow-md">
                    <rect x="2" y="2" width="46" height="36" rx="6" fill="white" stroke="#006B83" strokeWidth="2"/>
                    <path d="M25 10L35 15L25 20L15 15L25 10Z" stroke="#006B83" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M15 15V25L25 30V20" stroke="#006B83" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M35 15V25L25 30" stroke="#006B83" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                </div>

                <h3 className="text-[20px] font-bold text-global-navy mb-2">Sin registros</h3>
                <p className="text-[13px] text-global-text mb-6 leading-relaxed px-2">
                  Ingresa el nombre del pedido arriba para comenzar a registrar sus códigos y cantidades.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-global-text/70 bg-gray-50 px-3 py-1.5 rounded-md">
                  <FolderOpen size={14} />
                  <span>Cada venta mantiene su propio inventario.</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50/50">
                <h3 className="text-[12px] font-bold text-global-navy mb-3 px-1 uppercase tracking-wider opacity-80">Registros Anteriores</h3>
                <div className="space-y-2.5">
                  {ventas.map(venta => (
                    <div 
                      key={venta.id}
                      onClick={() => onSelectVenta(venta)}
                      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-global-teal hover:shadow-md active:scale-[0.98] transition-all group"
                    >
                      <div>
                        <h3 className="font-bold text-global-navy group-hover:text-global-teal transition-colors text-[15px]">{venta.name}</h3>
                        <p className="text-[12px] text-global-text mt-0.5">{venta.date}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => handleDeleteClick(venta.id, e)}
                          className="text-red-400 p-2.5 hover:bg-red-50 rounded-full transition-colors opacity-60 hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                        <ChevronRight className="text-gray-300 group-hover:text-global-teal transition-colors" size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL ELIMINAR */}
        {ventaToDelete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-global-navy/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-[320px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="p-6 text-center flex flex-col items-center gap-3">
                <div className="bg-red-50 p-3.5 rounded-full text-red-500 mb-1">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-[18px] font-bold text-global-navy">¿Eliminar registro?</h3>
                <p className="text-[13px] text-global-text">Esta acción borrará todos los códigos de esta venta. No se puede deshacer.</p>
              </div>
              <div className="flex border-t border-gray-100 bg-gray-50">
                <button 
                  onClick={() => setVentaToDelete(null)}
                  className="flex-1 py-4 text-[14px] text-global-text font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <div className="w-px bg-gray-200"></div>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 text-[14px] text-red-500 font-bold hover:bg-red-50 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}