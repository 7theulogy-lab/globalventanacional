import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileUp } from 'lucide-react';
import { parsePickingCsv, physicalByCode } from '../utils/picking.js';

export default function PickingSheet({ picking, items, onReplace, busy = false }) {
  const [notice, setNotice] = useState(null);
  const inputRef = useRef(null);
  const physical = useMemo(() => physicalByCode(items), [items]);
  const completed = picking.filter(row => physical.get(row.code) === Number(row.quantity)).length;

  const loadCsv = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const rows = parsePickingCsv(await file.text());
      const saved = await onReplace(rows);
      if (saved !== false) setNotice({ error: false, message: `${rows.length} códigos cargados desde ${file.name}.` });
    } catch (cause) {
      setNotice({ error: true, message: cause.message });
    }
  };

  return <section className="overflow-hidden rounded-xl border border-[#DCE2E7] bg-white shadow-sm" aria-labelledby="picking-title">
    <div className="border-b border-[#DCE2E7] px-5 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div>
        <h2 id="picking-title" className="text-lg font-semibold text-global-navy">Picking del pedido</h2>
        <p className="mt-1 text-[13px] text-global-text">Carga un CSV con las columnas Código y Cantidad.</p>
      </div>
      <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={loadCsv} className="sr-only" aria-label="Seleccionar archivo CSV de picking" />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md bg-global-teal px-3 text-sm font-medium text-white disabled:opacity-50 sm:mt-0 sm:shrink-0">
        <FileUp size={16} aria-hidden="true" /> {picking.length ? 'Reemplazar CSV' : 'Cargar CSV'}
      </button>
    </div>
    {notice && <p role={notice.error ? 'alert' : 'status'} className={`m-4 rounded-lg border px-4 py-3 text-sm ${notice.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-[#CFE7EA] bg-[#F2F8F9] text-global-blue'}`}>{notice.message}</p>}
    {picking.length ? <>
      <div className="flex items-center justify-between border-b border-[#DCE2E7] bg-gray-50 px-4 py-3 text-xs text-global-text">
        <span>{picking.length} códigos en el picking</span>
        <span className="inline-flex items-center gap-1 font-semibold text-green-700"><CheckCircle2 size={14} /> {completed} completos</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] border-collapse text-sm">
          <thead><tr className="border-b border-[#DCE2E7] bg-white text-left text-xs uppercase tracking-wide text-global-text"><th className="px-4 py-3">Código</th><th className="px-3 py-3 text-right">Cantidad</th><th className="px-4 py-3 text-right">Físico</th></tr></thead>
          <tbody className="divide-y divide-[#E8ECEF]">{picking.map(row => {
            const count = physical.get(row.code) ?? 0;
            const expected = Number(row.quantity);
            const stateClass = count === expected ? 'bg-green-50' : count > expected ? 'bg-red-50' : 'bg-white';
            return <tr key={row.code} className={stateClass}><td className="break-all px-4 py-3 font-mono font-semibold text-global-navy">{row.code}</td><td className="px-3 py-3 text-right font-semibold text-global-navy">{expected}</td><td className={`px-4 py-3 text-right font-bold ${count === expected ? 'text-green-700' : count > expected ? 'text-red-700' : 'text-global-blue'}`}>{count}</td></tr>;
          })}</tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[#DCE2E7] px-4 py-3 text-xs text-global-text"><span><i className="mr-1 inline-block h-3 w-3 rounded-sm border border-green-200 bg-green-50" />Completo</span><span><i className="mr-1 inline-block h-3 w-3 rounded-sm border border-red-200 bg-red-50" />Excedido</span></div>
    </> : <div className="px-6 py-12 text-center"><FileUp size={34} className="mx-auto mb-3 text-global-blue" /><h3 className="font-semibold text-global-navy">Aún no hay picking</h3><p className="mx-auto mt-2 max-w-sm text-[13px] text-global-text">Carga el CSV de esta venta para comparar la cantidad esperada con el conteo físico.</p></div>}
  </section>;
}
