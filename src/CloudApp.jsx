import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Building2, ChevronRight, Copy, Edit2, FolderOpen, Plus, Search, Trash2, Upload } from 'lucide-react';
import { supabase, displayCloudError, requireData } from './lib/supabase';
import { normalizeCode, parseQuantity } from './utils/inventory';
import { createBackup, parseBackup } from './utils/backup';
import { playSuccessSound } from './utils/audio';

function linkFor(orderId) {
  const url = new URL(window.location.href);
  if (orderId) url.searchParams.set('order', orderId);
  else url.searchParams.delete('order');
  url.searchParams.delete('access');
  url.hash = '';
  return url.toString();
}

function Notice({ message, error = false }) {
  if (!message) return null;
  return <p role={error ? 'alert' : 'status'} className={`mb-4 rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-[#CFE7EA] bg-[#F2F8F9] text-global-blue'}`}>{message}</p>;
}

function Header({ children }) {
  return <header className="bg-gradient-to-r from-global-blue to-global-teal text-white"><div className="mx-auto max-w-3xl px-4 py-5 sm:px-8">{children}</div></header>;
}

export default function CloudApp() {
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState(new URLSearchParams(window.location.search).get('order'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const requestNumber = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++requestNumber.current;
    try {
      const data = await requireData(supabase.rpc('shared_snapshot'));
      if (request === requestNumber.current) {
        setOrders(data.orders ?? []);
        setError('');
        setLoading(false);
      }
    } catch (cause) {
      if (request === requestNumber.current) {
        setError(displayCloudError(cause));
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 3000);
    const onFocus = () => refresh();
    const onPop = () => setSelectedId(new URLSearchParams(window.location.search).get('order'));
    window.addEventListener('focus', onFocus);
    window.addEventListener('popstate', onPop);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('popstate', onPop);
    };
  }, [refresh]);

  const mutate = async (action, payload) => {
    if (busy) return false;
    setBusy(true);
    try {
      await requireData(supabase.rpc('shared_mutate', {
        p_action: action, p_payload: payload
      }));
      await refresh();
      return true;
    } catch (cause) {
      setError(displayCloudError(cause));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const navigate = orderId => {
    window.history.pushState({}, '', linkFor(orderId));
    setSelectedId(orderId);
  };
  const selected = orders.find(order => order.id === selectedId);

  useEffect(() => {
    if (!loading && selectedId && !selected && !error) {
      window.history.replaceState({}, '', linkFor(null));
      setSelectedId(null);
    }
  }, [loading, selectedId, selected, error]);

  return <div className="min-h-screen bg-global-bg font-sans">
    {selectedId && selected ? <OrderScreen order={selected} onBack={() => navigate(null)} mutate={mutate} busy={busy} error={error} clearError={() => setError('')} />
      : <HomeScreen orders={orders} loading={loading} error={error} busy={busy} mutate={mutate} onSelect={navigate} refresh={refresh} />}
  </div>;
}

function HomeScreen({ orders, loading, error, busy, mutate, onSelect, refresh }) {
  const [name, setName] = useState('');
  const [edit, setEdit] = useState(null);
  const [remove, setRemove] = useState(null);
  const [message, setMessage] = useState('');
  const [localOrders] = useState(() => {
    try {
      const value = JSON.parse(window.localStorage.getItem('venta_nacional_list') ?? '[]');
      return Array.isArray(value) ? value : [];
    }
    catch { return []; }
  });
  const [importedIds, setImportedIds] = useState(() => {
    try {
      const value = JSON.parse(window.localStorage.getItem('venta_nacional_imported_shared') ?? '[]');
      return Array.isArray(value) ? value : [];
    }
    catch { return []; }
  });
  const [importing, setImporting] = useState(false);
  const pendingLocal = localOrders.filter(order => !importedIds.includes(order.id));

  const importOrders = async (backup, ids = []) => {
    if (importing) return;
    setImporting(true);
    try {
      const validated = parseBackup(JSON.stringify(backup));
      const count = await requireData(supabase.rpc('shared_import', { p_orders: validated.pedidos }));
      if (ids.length) {
        const next = [...importedIds, ...ids];
        window.localStorage.setItem('venta_nacional_imported_shared', JSON.stringify(next));
        setImportedIds(next);
      }
      await refresh();
      setMessage(`${count} pedidos importados a la lista compartida.`);
    } catch (cause) { setMessage(displayCloudError(cause)); }
    finally { setImporting(false); }
  };
  const importLocal = () => {
    try {
      const backup = createBackup(pendingLocal, window.localStorage);
      importOrders(backup, pendingLocal.map(order => order.id));
    } catch { setMessage('No se pudieron leer los pedidos guardados en esta PDA.'); }
  };
  const create = async event => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    const oldIds = new Set(orders.map(order => order.id));
    if (await mutate('create_order', { name: clean })) {
      setName('');
      try {
        const data = await requireData(supabase.rpc('shared_snapshot'));
        const created = data.orders.find(order => !oldIds.has(order.id));
        if (created) onSelect(created.id);
        else setMessage('Pedido agregado. Selecciónalo en la lista.');
      } catch { setMessage('Pedido agregado. Actualiza la lista para seleccionarlo.'); }
    }
  };
  const rename = async event => {
    event.preventDefault();
    if (await mutate('rename_order', { order_id: edit.id, name: edit.name })) {
      setEdit(null);
      setMessage('Nombre actualizado.');
    }
  };
  const deleteOrder = async () => {
    if (await mutate('delete_order', { order_id: remove.id })) {
      setRemove(null);
      setMessage('Pedido eliminado.');
    }
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(linkFor(null)); setMessage('Enlace compartido copiado.'); }
    catch { setMessage('No se pudo copiar el enlace.'); }
  };

  return <>
    <Header><div className="flex items-center gap-8 min-[390px]:gap-14"><img src="/globalmarket-logo.png" alt="Globalmarket Enterprise" className="h-20 w-20 shrink-0 rounded-full object-contain min-[390px]:h-[90px] min-[390px]:w-[90px]" /><h1 className="text-lg tracking-wide min-[390px]:text-xl">Venta Nacional</h1></div></Header>
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-8 sm:pt-10">
      <Notice error message={error} /><Notice message={message} />
      <p className="mb-2 text-xs text-global-text">Gestión y consolidación</p>
      <h2 className="mb-2 text-[30px] font-bold leading-tight text-global-navy min-[390px]:text-[32px]">Control de Calidad</h2>
      <p className="mb-4 text-sm text-global-text">Organizador de códigos, cantidades y exportador a Excel</p>
      <p className="mb-5 flex items-center gap-2 text-sm text-global-text"><Building2 size={16} /> Centro de distribución · Renca</p>
      <div className="overflow-hidden rounded-xl border border-[#DCE2E7] bg-white shadow-sm">
        <div className="p-5"><h3 className="mb-1.5 text-lg font-semibold text-global-navy">Comienza con un pedido</h3><p className="mb-5 text-[13px] text-global-text">Asigna un nombre a la venta para identificarla durante el registro.</p>
          <form onSubmit={create}><label htmlFor="new-order" className="mb-2 block text-[13px] font-semibold text-global-navy">Nombre del pedido</label><input id="new-order" required maxLength={120} value={name} onChange={e => setName(e.target.value.toUpperCase())} placeholder="Ingrese nombre" className="mb-3 w-full rounded-md border border-[#DCE2E7] px-3.5 py-3 text-sm focus:border-global-blue focus:outline-none" /><button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-global-teal py-3 text-sm font-medium text-white disabled:opacity-50"><Plus size={16} /> Agregar</button></form>
        </div>
        <div className="border-t border-[#DCE2E7] bg-white p-4 sm:p-5">
          {loading ? <p className="py-12 text-center text-sm text-global-text">Cargando pedidos...</p> : orders.length === 0 ? <div className="flex flex-col items-center py-12 text-center"><FolderOpen size={42} className="mb-4 text-global-blue" /><h3 className="text-xl font-semibold text-global-navy">Sin registros</h3><p className="mt-2 max-w-sm text-[13px] text-global-text">Ingresa el nombre del pedido arriba para comenzar a registrar sus códigos y cantidades.</p></div> : <><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-global-navy">Registros anteriores</h3><div className="space-y-2.5">{orders.map(order => <div key={order.id} className="flex items-center rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4"><button onClick={() => onSelect(order.id)} className="min-w-0 flex-1 text-left"><span className="block break-words font-bold text-global-navy">{order.name}</span><span className="text-xs text-global-text">{new Date(order.created_at).toLocaleDateString('es-CL')} · {order.items.length} códigos</span></button><ChevronRight size={18} className="text-gray-300" /><button onClick={() => setEdit({ id: order.id, name: order.name })} aria-label={`Renombrar ${order.name}`} className="p-2.5 text-global-blue"><Edit2 size={18} /></button><button onClick={() => setRemove(order)} aria-label={`Eliminar ${order.name}`} className="p-2.5 text-red-500"><Trash2 size={18} /></button></div>)}</div></>}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2"><button onClick={copyLink} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#DCE2E7] bg-white px-3 text-sm text-global-blue"><Copy size={16} /> Copiar enlace compartido</button><button onClick={() => refresh()} className="min-h-10 rounded-md border border-[#DCE2E7] bg-white px-3 text-sm text-global-blue">Actualizar</button></div>
      <p className="mt-3 text-xs text-global-text">Los pedidos se actualizan automáticamente en todos los dispositivos cada pocos segundos. Quien tenga el enlace puede modificarlos.</p>
      {pendingLocal.length > 0 && <button onClick={importLocal} disabled={importing} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#DCE2E7] bg-white px-3 text-sm text-global-blue disabled:opacity-50"><Upload size={16} /> Incorporar {pendingLocal.length} pedidos guardados en esta PDA</button>}
    </main>
    {edit && <Modal title="Renombrar pedido" onCancel={() => setEdit(null)} onConfirm={rename} confirm="Guardar nombre" busy={busy}><label htmlFor="rename-order" className="mb-2 block text-sm font-semibold text-global-navy">Nombre del pedido</label><input id="rename-order" autoFocus required maxLength={120} value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value.toUpperCase() })} className="w-full rounded-md border border-[#DCE2E7] px-3 py-3 text-sm" /></Modal>}
    {remove && <Modal title="¿Eliminar pedido?" onCancel={() => setRemove(null)} onConfirm={deleteOrder} confirm="Eliminar" danger busy={busy}><p className="text-sm text-global-text">Se borrarán también todos los códigos de {remove.name}. Esta acción no se puede deshacer.</p></Modal>}
  </>;
}

function Modal({ title, children, onCancel, onConfirm, confirm, danger = false, busy = false }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-global-navy/40 p-4" role="dialog" aria-modal="true" aria-label={title}><form onSubmit={event => { event.preventDefault(); onConfirm(event); }} className="w-full max-w-[360px] overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="p-6"><h2 className="mb-3 text-lg font-bold text-global-navy">{title}</h2>{children}</div><div className="flex border-t border-gray-100 bg-gray-50"><button type="button" onClick={onCancel} className="min-h-12 flex-1 text-sm font-semibold text-global-text">Cancelar</button><button disabled={busy} type="submit" className={`min-h-12 flex-1 border-l border-gray-200 text-sm font-semibold disabled:opacity-50 ${danger ? 'text-red-600' : 'text-global-blue'}`}>{confirm}</button></div></form></div>;
}

function OrderScreen({ order, onBack, mutate, busy, error, clearError }) {
  const [code, setCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState(null);
  const [remove, setRemove] = useState(null);
  const [clear, setClear] = useState(false);
  const [message, setMessage] = useState('');
  const codeRef = useRef(null);
  const items = order.items;
  const total = items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const visible = items.filter(item => item.code.includes(search.toUpperCase()));

  const add = async event => {
    event.preventDefault(); clearError();
    try {
      const normalized = normalizeCode(code);
      const count = parseQuantity(quantity);
      if (await mutate('add_item', { order_id: order.id, code: normalized, quantity: count })) {
        playSuccessSound(); setCode(''); setQuantity(''); setMessage(`${normalized}: ${count} unidades registradas.`); codeRef.current?.focus();
      }
    } catch (cause) { setMessage(cause.message); }
  };
  const saveEdit = async event => {
    event.preventDefault(); clearError();
    try {
      const normalized = normalizeCode(edit.code);
      const count = parseQuantity(edit.quantity);
      if (await mutate('edit_item', { item_id: edit.id, code: normalized, quantity: count })) {
        setEdit(null); setMessage(`${normalized} actualizado. Si ya existía, se sumaron las cantidades.`);
      }
    } catch (cause) { setMessage(cause.message); }
  };
  const deleteItem = async () => {
    if (await mutate('delete_item', { item_id: remove.id })) { setRemove(null); setMessage('Código borrado.'); }
  };
  const clearAll = async () => {
    if (await mutate('clear_items', { order_id: order.id })) { setClear(false); setMessage('Se borraron todos los códigos.'); }
  };
  const copyExcel = async () => {
    try { await navigator.clipboard.writeText('Código\tCantidad\n' + items.map(item => `${item.code}\t${item.quantity}`).join('\n')); setMessage('Tabla copiada para pegar en Excel.'); }
    catch { setMessage('No se pudo copiar la tabla.'); }
  };

  return <>
    <Header><div className="flex items-center justify-between gap-2"><button onClick={onBack} className="inline-flex min-h-10 items-center gap-1 text-sm"><ArrowLeft size={18} /> Pedidos</button><button onClick={copyExcel} disabled={!items.length} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/45 px-3 text-sm disabled:opacity-50"><Copy size={16} /> Copiar para Excel</button></div><p className="mt-4 text-xs text-white/85">Control de Calidad · Venta Nacional</p><h1 className="mt-1 break-words text-[26px] font-semibold">{order.name}</h1><p className="mt-2 text-sm text-white/90">{items.length} códigos · {total} unidades</p></Header>
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-16 pt-6 sm:px-8 sm:pt-10"><Notice error message={error} /><Notice message={message} />
      <section className="rounded-xl border border-[#DCE2E7] bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-global-navy">Registrar código</h2><p className="mb-5 mt-1 text-[13px] text-global-text">Agrega el código y la cantidad de este pedido.</p><form onSubmit={add} className="grid grid-cols-[minmax(0,1fr)_88px] items-end gap-3 sm:grid-cols-[minmax(0,1fr)_112px_auto]"><div className="min-w-0"><label htmlFor="cloud-code" className="mb-2 block text-[13px] font-semibold text-global-navy">Código</label><input id="cloud-code" ref={codeRef} required maxLength={120} value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ej: IP8194" className="w-full rounded-md border border-[#DCE2E7] px-3 py-3 text-sm font-semibold" /></div><div><label htmlFor="cloud-quantity" className="mb-2 block text-[13px] font-semibold text-global-navy">Cant.</label><input id="cloud-quantity" required inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="1" className="w-full rounded-md border border-[#DCE2E7] px-2 py-3 text-center text-sm font-semibold" /></div><button disabled={busy} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-global-teal px-5 text-sm text-white disabled:opacity-50 sm:col-span-1"><Plus size={17} /> Agregar</button></form></section>
      <section className="overflow-hidden rounded-xl border border-[#DCE2E7] bg-white shadow-sm"><div className="border-b border-[#DCE2E7] px-5 py-4 sm:flex sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-global-navy">Códigos registrados</h2><p className="mt-1 text-[13px] text-global-text">Consulta y corrige los registros de este pedido.</p></div>{items.length > 0 && <button onClick={() => setClear(true)} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-md border border-red-200 px-3 text-sm text-red-600 sm:mt-0"><Trash2 size={16} /> Borrar todos</button>}</div>
        {items.length > 0 && <div className="relative border-b border-[#DCE2E7] p-4"><Search size={17} className="absolute left-7 top-1/2 -translate-y-1/2 text-global-text" /><input type="search" aria-label="Buscar código" placeholder="Buscar código..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-md border border-[#DCE2E7] py-3 pl-10 pr-3 text-sm" /></div>}
        {visible.length ? <ul className="divide-y divide-[#E8ECEF]">{visible.map(item => <li key={item.id} className="flex min-h-[68px] items-center gap-2 px-3 py-2.5 sm:px-5"><span className="min-w-0 flex-1 break-all font-mono text-sm font-semibold text-global-navy">{item.code}</span><span className="rounded-md border border-[#CFE7EA] bg-[#F2F8F9] px-2 py-1 text-sm font-semibold text-global-blue">{item.quantity}</span><button onClick={() => setEdit({ ...item })} aria-label={`Editar ${item.code}`} className="p-2.5 text-global-blue"><Edit2 size={17} /></button><button onClick={() => setRemove(item)} aria-label={`Borrar ${item.code}`} className="p-2.5 text-red-500"><Trash2 size={17} /></button></li>)}</ul> : <div className="px-6 py-12 text-center"><h3 className="text-base font-semibold text-global-navy">{search ? 'Sin coincidencias' : 'Aún no hay códigos'}</h3><p className="mt-2 text-[13px] text-global-text">{search ? 'Prueba con otro código.' : 'Ingresa el primer código y su cantidad para comenzar.'}</p></div>}
      </section>
    </main>
    {edit && <Modal title="Editar código" onCancel={() => setEdit(null)} onConfirm={saveEdit} confirm="Guardar" busy={busy}><div className="grid grid-cols-[minmax(0,1fr)_88px] gap-3"><div><label htmlFor="edit-code" className="mb-2 block text-sm font-semibold">Código</label><input id="edit-code" autoFocus required maxLength={120} value={edit.code} onChange={e => setEdit({ ...edit, code: e.target.value.toUpperCase() })} className="w-full rounded-md border border-[#DCE2E7] px-3 py-3 text-sm" /></div><div><label htmlFor="edit-quantity" className="mb-2 block text-sm font-semibold">Cant.</label><input id="edit-quantity" required inputMode="numeric" value={edit.quantity} onChange={e => setEdit({ ...edit, quantity: e.target.value })} className="w-full rounded-md border border-[#DCE2E7] px-2 py-3 text-center text-sm" /></div></div></Modal>}
    {remove && <Modal title="¿Borrar código?" onCancel={() => setRemove(null)} onConfirm={deleteItem} confirm="Borrar" danger busy={busy}><p className="text-sm text-global-text">Se eliminará {remove.code} de este pedido.</p></Modal>}
    {clear && <Modal title="¿Borrar todos los códigos?" onCancel={() => setClear(false)} onConfirm={clearAll} confirm="Borrar todos" danger busy={busy}><p className="text-sm text-global-text">Se eliminarán los {items.length} códigos de {order.name}. El pedido se conservará.</p></Modal>}
  </>;
}
