import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import StorageAlert from './StorageAlert';
import { Plus, ChevronRight, Trash2, Edit2, AlertTriangle, Building2, FolderOpen } from 'lucide-react';

export default function Dashboard({ onSelectVenta }) {
  const [ventas, setVentas, storageError] = useLocalStorage('venta_nacional_list', []);
  const [newVentaName, setNewVentaName] = useState('');
  const [ventaToDelete, setVentaToDelete] = useState(null);
  const [ventaToRename, setVentaToRename] = useState(null);
  const [renamedValue, setRenamedValue] = useState('');
  const [actionError, setActionError] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newVentaName.trim()) return;
    const newVenta = {
      id: globalThis.crypto?.randomUUID?.() ?? Date.now().toString(),
      name: newVentaName.trim(),
      date: new Date().toLocaleDateString('es-CL')
    };
    
    if (!setVentas([newVenta, ...ventas])) return;
    setActionError('');
    setNewVentaName('');
    onSelectVenta(newVenta);
  };

  const handleRenameClick = (venta, e) => {
    e.stopPropagation();
    setVentaToRename(venta.id);
    setRenamedValue(venta.name);
  };

  const confirmRename = e => {
    e.preventDefault();
    const name = renamedValue.trim();
    if (!name) return;
    if (!setVentas(ventas.map(venta => venta.id === ventaToRename ? { ...venta, name } : venta))) {
      setVentaToRename(null);
      return;
    }
    setVentaToRename(null);
    setRenamedValue('');
    setActionError('');
  };

  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    setVentaToDelete(id);
  };

  const confirmDelete = () => {
    if (ventaToDelete) {
      if (!setVentas(ventas.filter(v => v.id !== ventaToDelete))) {
        setVentaToDelete(null);
        return;
      }
      try {
        localStorage.removeItem(`venta_items_${ventaToDelete}`);
        setActionError('');
      } catch {
        setActionError('El pedido se quitó de la lista, pero no se pudo limpiar su copia local.');
      }
      setVentaToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-global-bg font-sans">
      <header className="bg-gradient-to-r from-global-blue to-global-teal text-white">
        <div className="mx-auto flex h-28 max-w-3xl items-center gap-8 px-4 min-[390px]:gap-14 sm:px-8">
          <img
            src="/globalmarket-logo.png"
            alt="Globalmarket Enterprise"
            className="h-20 w-20 shrink-0 rounded-full object-contain min-[390px]:h-[90px] min-[390px]:w-[90px]"
          />
          <h1 className="whitespace-nowrap text-lg font-normal tracking-wide min-[390px]:text-xl">Venta Nacional</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-8 sm:pt-10">
          <StorageAlert message={storageError || actionError} />
          {/* TÍTULOS */}
          <p className="mb-2 text-xs text-global-text">Gestión y consolidación</p>
          <h2 className="mb-2 text-[30px] font-bold leading-tight tracking-tight text-global-navy min-[390px]:text-[32px]">Control de Calidad</h2>
          <p className="mb-4 text-sm leading-relaxed text-global-text">Organizador de códigos, cantidades y exportador a Excel</p>
          
          <div className="mb-5 flex items-center gap-2 text-sm text-global-text">
            <Building2 size={16} className="text-global-text opacity-70" />
            <span>Centro de distribución · Renca</span>
          </div>

          {/* TARJETA UNIFICADA (FORMULARIO + ESTADO/LISTA) */}
          <div className="overflow-hidden rounded-xl border border-[#DCE2E7] bg-white shadow-sm">
            
            {/* SECCIÓN 1: FORMULARIO */}
            <div className="p-5">
              <h3 className="mb-1.5 text-lg font-semibold text-global-navy">Comienza con un pedido</h3>
              <p className="mb-5 text-[13px] leading-relaxed text-global-text">Asigna un nombre a la venta para identificarla durante el registro.</p>
              
              <form onSubmit={handleCreate}>
                <label htmlFor="new-venta-name" className="mb-2 block text-[13px] font-semibold text-global-navy">Nombre del pedido</label>
                <input
                  id="new-venta-name"
                  type="text"
                  placeholder="Ingrese nombre"
                  className="mb-3 w-full rounded-md border border-[#DCE2E7] px-3.5 py-3 text-sm font-medium placeholder-gray-400 focus:border-global-blue focus:outline-none focus:ring-2 focus:ring-global-blue/20"
                  value={newVentaName}
                  onChange={(e) => setNewVentaName(e.target.value.toUpperCase())}
                />
                <button 
                  type="submit" 
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-global-teal py-3 text-sm font-medium text-white transition-colors hover:bg-[#528C96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-global-blue"
                >
                  <Plus size={16} aria-hidden="true" />
                  Agregar
                </button>
              </form>
            </div>

            {/* SEPARADOR (HR) */}
            <div className="h-px w-full bg-[#DCE2E7]"></div>

            {/* SECCIÓN 2: ESTADO VACÍO O LISTADO */}
            {ventas.length === 0 ? (
              <div className="flex flex-col items-center px-5 pb-6 pt-8 text-center sm:pb-10">
                
                {/* ILUSTRACIÓN ESTADO VACÍO SVG */}
                <div className="relative mb-7 flex h-[130px] w-[130px] items-center justify-center rounded-full bg-[#EDF5FC]">
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

                <h3 className="mb-2 text-xl font-semibold text-global-navy">Sin registros</h3>
                <p className="mb-4 max-w-sm px-2 text-[13px] leading-relaxed text-global-text">
                  Ingresa el nombre del pedido arriba para comenzar a registrar sus códigos y cantidades.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-global-text">
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
                      className="group flex items-center rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:border-global-teal hover:shadow-md sm:p-4"
                    >
                      <button type="button" onClick={() => onSelectVenta(venta)} className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-global-blue">
                        <span className="min-w-0">
                          <span className="block break-words text-[15px] font-bold text-global-navy transition-colors group-hover:text-global-teal">{venta.name}</span>
                          <span className="mt-0.5 block text-xs text-global-text">{venta.date}</span>
                        </span>
                        <ChevronRight className="shrink-0 text-gray-300 transition-colors group-hover:text-global-teal" size={20} aria-hidden="true" />
                      </button>
                      <div className="ml-1 flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => handleRenameClick(venta, e)}
                          aria-label={`Renombrar ${venta.name}`}
                          className="rounded-full p-2.5 text-global-blue hover:bg-[#F2F8F9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-global-blue"
                        >
                          <Edit2 size={18} aria-hidden="true" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteClick(venta.id, e)}
                          aria-label={`Eliminar ${venta.name}`}
                          className="text-red-400 p-2.5 hover:bg-red-50 rounded-full transition-colors opacity-60 hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
      </main>

        {ventaToRename && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-global-navy/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="rename-title">
            <form onSubmit={confirmRename} className="w-full max-w-[360px] overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="p-6">
                <h2 id="rename-title" className="text-lg font-bold text-global-navy">Renombrar pedido</h2>
                <p className="mb-4 mt-1 text-sm text-global-text">Corrige el nombre sin perder los códigos registrados.</p>
                <label htmlFor="rename-venta" className="mb-2 block text-sm font-semibold text-global-navy">Nombre del pedido</label>
                <input id="rename-venta" autoFocus required value={renamedValue} onChange={e => setRenamedValue(e.target.value.toUpperCase())} className="w-full rounded-md border border-[#DCE2E7] px-3 py-3 text-sm focus:border-global-blue focus:outline-none focus:ring-2 focus:ring-global-blue/20" />
              </div>
              <div className="flex border-t border-gray-100 bg-gray-50">
                <button type="button" onClick={() => setVentaToRename(null)} className="min-h-12 flex-1 text-sm font-semibold text-global-text hover:bg-gray-100">Cancelar</button>
                <button type="submit" className="min-h-12 flex-1 border-l border-gray-200 text-sm font-semibold text-global-blue hover:bg-[#F2F8F9]">Guardar nombre</button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL ELIMINAR */}
        {ventaToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-global-navy/40 p-4 backdrop-blur-sm">
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
  );
}
