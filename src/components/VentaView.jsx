import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, Package, Edit2, Copy, Save, X, Plus, Trash, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';
import StorageAlert from './StorageAlert';
import { playSuccessSound } from '../utils/audio';
import { addCode, editCode, consolidateItems } from '../utils/inventory';

export default function VentaView({ venta, onBack }) {
  const [items, setItems, storageError] = useLocalStorage(`venta_items_${venta.id}`, []);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [codigo, setCodigo] = useState('');
  const [cantidad, setCantidad] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [editCodigo, setEditCodigo] = useState('');
  const [editCantidad, setEditCantidad] = useState('');

  const [itemToDelete, setItemToDelete] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const codigoInputRef = useRef(null);
  const editCodigoRef = useRef(null);
  const initializedHistoryRef = useRef(false);

  useEffect(() => {
    try {
      const result = consolidateItems(items);
      if (result.changed && setItems(result.items)) {
        setFeedback({ type: 'success', message: 'Se unificaron códigos repetidos guardados anteriormente.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Hay códigos guardados con datos inválidos. Revisa este pedido.' });
    }
  }, [items]);

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state?.screen === 'edit' && e.state.ventaId === venta.id) {
        const item = items.find(entry => entry.id === e.state.itemId);
        if (item) {
          setEditingId(item.id);
          setEditCodigo(item.codigo);
          setEditCantidad(item.cantidad);
        }
      } else if (e.state?.screen === 'venta') {
        setEditingId(null);
        setItemToDelete(null);
        setAlertInfo(null);
        setConfirmClearAll(false);
      }
    };
    if (!initializedHistoryRef.current) {
      initializedHistoryRef.current = true;
      if (window.history.state?.screen === 'edit') handlePopState({ state: window.history.state });
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [items, venta.id]);

  useEffect(() => {
    if (!editingId && !itemToDelete && !confirmClearAll && !alertInfo) {
      setTimeout(() => codigoInputRef.current?.focus(), 50);
    } else if (editingId) {
      setTimeout(() => editCodigoRef.current?.focus(), 50);
    }
  }, [editingId, itemToDelete, confirmClearAll, alertInfo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const id = globalThis.crypto?.randomUUID?.() ?? Date.now().toString();
      const result = addCode(items, codigo, cantidad, id);
      if (!setItems(result.items)) {
        setFeedback({ type: 'error', message: 'No se guardó el código en este dispositivo.' });
        return;
      }

      playSuccessSound();
      setFeedback({
        type: 'success',
        message: result.merged
          ? `${result.code} ya existía: ${result.previousQuantity} → ${result.nextQuantity} unidades.`
          : `${result.code} agregado: ${result.nextQuantity} unidades.`
      });
      setCodigo('');
      setCantidad('');
      requestAnimationFrame(() => codigoInputRef.current?.focus());
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  };

  const handleEdit = (item) => {
    window.history.pushState({ screen: 'edit', ventaId: venta.id, itemId: item.id }, '');
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
    try {
      const result = editCode(items, editingId, editCodigo, editCantidad);
      if (!setItems(result.items)) {
        setFeedback({ type: 'error', message: 'No se guardó la corrección en este dispositivo.' });
        return;
      }

      playSuccessSound();
      setFeedback({
        type: 'success',
        message: result.merged
          ? `${result.code} unificado: ${result.previousQuantity} → ${result.nextQuantity} unidades.`
          : `${result.code} actualizado.`
      });
      cancelEdit();
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      if (setItems(items.filter(item => item.id !== itemToDelete))) {
        setItemToDelete(null);
        setFeedback({ type: 'success', message: 'Código borrado.' });
      } else {
        setItemToDelete(null);
        setFeedback({ type: 'error', message: 'No se pudo borrar el código.' });
      }
    }
  };

  const clearAll = () => {
    if (!setItems([])) {
      setConfirmClearAll(false);
      setFeedback({ type: 'error', message: 'No se pudieron borrar los códigos.' });
      return;
    }
    setConfirmClearAll(false);
    setSearchQuery('');
    setEditingId(null);
    setFeedback({ type: 'success', message: 'Se borraron todos los códigos de este pedido.' });
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
    <div className="min-h-screen bg-global-bg font-sans">
      <header className="bg-gradient-to-r from-global-blue to-global-teal text-white">
        <div className="mx-auto max-w-3xl px-4 pb-6 pt-4 sm:px-8 sm:pb-8">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Pedidos
            </button>
            <button
              type="button"
              onClick={copyToExcel}
              disabled={items.length === 0}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/45 bg-white/10 px-3 text-sm font-medium hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Copy size={16} aria-hidden="true" />
              Copiar para Excel
            </button>
          </div>
          <p className="mt-4 text-xs text-white/85">Control de Calidad · Venta Nacional</p>
          <h1 className="mt-1 break-words text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]">{venta.name}</h1>
          <p className="mt-2 text-sm text-white/90">{items.length} {items.length === 1 ? 'código' : 'códigos'} · {totalItems} {totalItems === 1 ? 'unidad' : 'unidades'}</p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-16 pt-6 sm:gap-6 sm:px-8 sm:pt-10">
        <StorageAlert message={storageError} />
        {feedback && (
          <div role={feedback.type === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-[#CFE7EA] bg-[#F2F8F9] text-global-blue'}`}>
            {feedback.message}
          </div>
        )}
        <section className="rounded-xl border border-[#DCE2E7] bg-white p-5 shadow-sm" aria-labelledby="register-title">
          <h2 id="register-title" className="text-lg font-semibold text-global-navy">Registrar código</h2>
          <p className="mb-5 mt-1 text-[13px] leading-relaxed text-global-text">Agrega el código y la cantidad de este pedido.</p>
          <form onSubmit={handleSubmit} className="grid grid-cols-[minmax(0,1fr)_88px] items-end gap-3 sm:grid-cols-[minmax(0,1fr)_112px_auto]">
            <div className="min-w-0">
              <label htmlFor="new-code" className="mb-2 block text-[13px] font-semibold text-global-navy">Código</label>
              <input 
                id="new-code"
                ref={codigoInputRef}
                type="text" 
                required
                className="w-full rounded-md border border-[#DCE2E7] px-3 py-3 text-sm font-semibold uppercase text-global-navy placeholder-gray-400 focus:border-global-blue focus:outline-none focus:ring-2 focus:ring-global-blue/20"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: IP8194"
              />
            </div>
            <div>
              <label htmlFor="new-quantity" className="mb-2 block text-[13px] font-semibold text-global-navy">Cant.</label>
              <input 
                id="new-quantity"
                type="text"
                required
                inputMode="numeric"
                className="w-full rounded-md border border-[#DCE2E7] px-2 py-3 text-center text-sm font-semibold text-global-navy placeholder-gray-400 focus:border-global-blue focus:outline-none focus:ring-2 focus:ring-global-blue/20"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="1"
              />
            </div>
            <button 
              type="submit" 
              className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-global-teal px-5 text-sm font-medium text-white transition-colors hover:bg-[#528C96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-global-blue sm:col-span-1"
            >
              <Plus size={17} aria-hidden="true" />
              Agregar
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#DCE2E7] bg-white shadow-sm" aria-labelledby="registered-title">
          <div className="border-b border-[#DCE2E7] px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-3">
            <div>
              <h2 id="registered-title" className="text-lg font-semibold text-global-navy">Códigos registrados</h2>
              <p className="mt-1 text-[13px] text-global-text">Consulta y corrige los registros de este pedido.</p>
            </div>
            {items.length > 0 && (
              <button type="button" onClick={() => setConfirmClearAll(true)} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-md border border-red-200 px-3 text-sm font-medium text-red-600 hover:bg-red-50 sm:mt-0 sm:shrink-0">
                <Trash2 size={16} aria-hidden="true" /> Borrar todos
              </button>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-b border-[#DCE2E7] p-4 sm:p-5">
              <label htmlFor="search-code" className="sr-only">Buscar código</label>
              <div className="relative">
                <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-global-text" />
                <input
                  id="search-code"
                  type="search"
                  placeholder="Buscar código..."
                  className="w-full rounded-md border border-[#DCE2E7] py-3 pl-10 pr-3 text-sm text-global-navy placeholder-gray-400 focus:border-global-blue focus:outline-none focus:ring-2 focus:ring-global-blue/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {filteredItems.length > 0 ? (
            <ul className="divide-y divide-[#E8ECEF]">
              {filteredItems.map(item => (
                <li key={item.id}>
                  {editingId === item.id ? (
                    <form onSubmit={saveEdit} className="border-l-[3px] border-global-blue bg-[#F2F8F9] p-4">
                      <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-3">
                        <div className="min-w-0">
                          <label htmlFor={`edit-code-${item.id}`} className="mb-2 block text-[13px] font-semibold text-global-navy">Código</label>
                          <input
                            id={`edit-code-${item.id}`}
                            ref={editCodigoRef}
                            type="text"
                            required
                            className="w-full rounded-md border border-[#DCE2E7] bg-white px-3 py-3 text-sm font-semibold uppercase text-global-navy focus:border-global-blue focus:outline-none focus:ring-2 focus:ring-global-blue/20"
                            value={editCodigo}
                            onChange={(e) => setEditCodigo(e.target.value.toUpperCase())}
                          />
                        </div>
                        <div>
                          <label htmlFor={`edit-quantity-${item.id}`} className="mb-2 block text-[13px] font-semibold text-global-navy">Cant.</label>
                          <input
                            id={`edit-quantity-${item.id}`}
                            type="text"
                            required
                            inputMode="numeric"
                            className="w-full rounded-md border border-[#DCE2E7] bg-white px-2 py-3 text-center text-sm font-semibold text-global-navy focus:border-global-blue focus:outline-none focus:ring-2 focus:ring-global-blue/20"
                            value={editCantidad}
                            onChange={(e) => setEditCantidad(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <button type="button" onClick={cancelEdit} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-[#DCE2E7] bg-white px-3 text-sm font-medium text-global-text hover:bg-gray-50">
                          <X size={15} aria-hidden="true" /> Cancelar
                        </button>
                        <button type="submit" className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-global-teal px-3 text-sm font-medium text-white hover:bg-[#528C96]">
                          <Save size={15} aria-hidden="true" /> Guardar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex min-h-[68px] items-center gap-2 px-3 py-2.5 sm:px-5">
                      <span className="min-w-0 flex-1 break-all font-mono text-sm font-semibold text-global-navy">{item.codigo}</span>
                      <span className="min-w-10 rounded-md border border-[#CFE7EA] bg-[#F2F8F9] px-2 py-1 text-center text-sm font-semibold text-global-blue" aria-label={`${item.cantidad} unidades`}>{item.cantidad}</span>
                      <div className="flex items-center">
                        <button type="button" onClick={() => handleEdit(item)} aria-label={`Editar ${item.codigo}`} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-global-blue hover:bg-[#F2F8F9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-global-blue">
                          <Edit2 size={17} aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => setItemToDelete(item.id)} aria-label={`Borrar ${item.codigo}`} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-red-500 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500">
                          <Trash size={17} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EDF5FC] text-global-blue">
                {searchQuery ? <Search size={26} aria-hidden="true" /> : <Package size={26} aria-hidden="true" />}
              </div>
              <h3 className="text-base font-semibold text-global-navy">{searchQuery ? 'Sin coincidencias' : 'Aún no hay códigos'}</h3>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-global-text">
                {searchQuery ? 'Prueba con otro código en el buscador.' : 'Ingresa el primer código y su cantidad para comenzar.'}
              </p>
            </div>
          )}
        </section>
      </main>

        {/* MODAL BORRAR FILA */}
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-global-navy/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Borrar código">
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

        {confirmClearAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-global-navy/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="clear-all-title">
            <div className="w-full max-w-[340px] overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="rounded-full bg-red-50 p-3.5 text-red-500"><Trash2 size={30} aria-hidden="true" /></div>
                <h2 id="clear-all-title" className="text-lg font-bold text-global-navy">¿Borrar todos los códigos?</h2>
                <p className="text-sm leading-relaxed text-global-text">Se eliminarán los {items.length} códigos de {venta.name}. El pedido se conservará. Esta acción no se puede deshacer.</p>
              </div>
              <div className="flex border-t border-gray-100 bg-gray-50">
                <button type="button" onClick={() => setConfirmClearAll(false)} className="min-h-12 flex-1 text-sm font-semibold text-global-text hover:bg-gray-100">Cancelar</button>
                <button type="button" onClick={clearAll} className="min-h-12 flex-1 border-l border-gray-200 text-sm font-semibold text-red-600 hover:bg-red-50">Borrar todos</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ALERTA EXCEL */}
        {alertInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-global-navy/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Resultado de la copia">
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
  );
}
