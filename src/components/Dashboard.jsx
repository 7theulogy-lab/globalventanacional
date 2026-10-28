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
    <div className="max-w-md mx-auto min-h-screen bg-global-bg relative overflow-hidden pb-10">
      
      {/* CABECERA CON DEGRADADO Y LOGO */}
      <div className="bg-gradient-to-r from-global-blue to-global-teal px-6 py-8 flex items-center gap-4 text-white rounded-b-xl shadow-md">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-2 border-white overflow-hidden shadow-sm shrink-0">
          {/* Logo simulado por CSS basado en la imagen */}
          <div className="text-center leading-none mt-1">
             <span className="text-global-blue font-bold tracking-tight text-[11px]">global</span><span className="text-global-blue font-light tracking-tight text-[11px]">market</span>
             <div className="text-global-blue text-[5px] tracking-widest uppercase mt-0.5">Enterprise</div>
          </div>
        </div>
        <h1 className="text-xl font-medium tracking-wide">Venta Nacional</h1>
      </div>

      <div className="px-5 pt-6">
        {/* TÍTULOS Y DESCRIPCIÓN */}
        <p className="text-xs text-global-text mb-1 uppercase tracking-wide">Gestión y consolidación</p>
        <h2 className="text-3xl font-bold text-global-navy mb-2 tracking-tight">Control de Calidad</h2>
        <p className="text-sm text-global-text mb-4">Organizador de códigos, cantidades y exportador a excel</p>
        
        <div className="flex items-center gap-2 text-xs text-global-text mb-6">
          <Building2 size={14} className="text-global-teal" />
          <span>Centro de distribución · Renca</span>
        </div>

        {/* TARJETA DE CREACIÓN (FORMULARIO) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="text-lg font-bold text-global-navy mb-1">Comienza con un pedido</h3>
          <p className="text-xs text-global-text mb-4 leading-relaxed">Asigna un nombre a la venta para identificarla durante el registro.</p>
          
          <form onSubmit={handleCreate}>
            <label className="block text-xs font-bold text-global-navy mb-1.5">Nombre del pedido</label>
            <input
              type="text"
              placeholder="Ingrese nombre"
              className="w-full p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-global-teal focus:ring-1 focus:ring-global-teal text-sm font-medium mb-3 placeholder-gray-400"
              value={newVentaName}
              onChange={(e) => setNewVentaName(e.target.value.toUpperCase())}
            />
            <button 
              type="submit" 
              className="w-full bg-global-teal text-white py-3 rounded-lg font-medium hover:bg-opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus size={18} />
              Agregar
            </button>
          </form>
        </div>

        {/* ESTADO VACÍO O LISTA DE VENTAS */}
        {ventas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center flex flex-col items-center">
            
            {/* ILUSTRACIÓN ESTADO VACÍO RECREADA EN SVG */}
            <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center mb-6 relative">
              <svg width="60" height="70" viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -ml-2 -mt-2">
                <rect x="5" y="5" width="40" height="50" rx="4" transform="rotate(-10 5 5)" fill="white" stroke="#006B83" strokeWidth="2"/>
                <line x1="15" y1="20" x2="35" y2="16" stroke="#006B83" strokeWidth="3" strokeLinecap="round"/>
                <line x1="13" y1="30" x2="40" y2="25" stroke="#006B83" strokeWidth="3" strokeLinecap="round"/>
                <line x1="11" y1="40" x2="28" y2="37" stroke="#006B83" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <svg width="50" height="40" viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute mt-6 ml-4">
                <rect x="2" y="2" width="46" height="36" rx="4" fill="white" stroke="#006B83" strokeWidth="2"/>
                {/* Caja 3D simplificada */}
                <path d="M25 10L35 15L25 20L15 15L25 10Z" stroke="#006B83" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M15 15V25L25 30V20" stroke="#006B83" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M35 15V25L25 30" stroke="#006B83" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>

            <h3 className="text-xl font-bold text-global-navy mb-2">Sin registros</h3>
            <p className="text-xs text-global-text mb-4 leading-relaxed">
              Ingresa el nombre del pedido arriba para comenzar a registrar sus códigos y cantidades.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <FolderOpen size={12} />
              <span>Cada venta mantiene su propio inventario.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
             <h3 className="text-sm font-bold text-global-navy mb-2 px-1">Registros Anteriores</h3>
            {ventas.map(venta => (
              <div 
                key={venta.id}
                onClick={() => onSelectVenta(venta)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-global-teal hover:shadow-md active:scale-[0.98] transition-all group"
              >
                <div>
                  <h3 className="font-bold text-global-navy group-hover:text-global-teal transition-colors">{venta.name}</h3>
                  <p className="text-xs text-global-text">{venta.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => handleDeleteClick(venta.id, e)}
                    className="text-red-400 p-2 hover:bg-red-50 rounded-full transition-colors opacity-70 hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                  <ChevronRight className="text-gray-300 group-hover:text-global-teal transition-colors" size={20} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL CONFIRMACIÓN DE ELIMINAR */}
      {ventaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-global-navy/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center flex flex-col items-center gap-3">
              <div className="bg-red-50 p-3 rounded-full text-red-500 mb-2">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-global-navy">¿Eliminar registro?</h3>
              <p className="text-sm text-global-text">Esta acción no se puede deshacer y borrará todos los códigos guardados en esta venta.</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button 
                onClick={() => setVentaToDelete(null)}
                className="flex-1 py-4 text-global-text font-bold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <div className="w-px bg-gray-100"></div>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-4 text-red-500 font-bold hover:bg-red-50 transition-colors"
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
