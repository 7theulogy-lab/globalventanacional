import { addCode, normalizeCode, parseQuantity } from './inventory.js';

export const BACKUP_FORMAT = 'venta-nacional-backup';

export function createBackup(ventas, storage) {
  return {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    pedidos: ventas.map(venta => ({
      name: venta.name,
      date: venta.date,
      items: JSON.parse(storage.getItem(`venta_items_${venta.id}`) ?? '[]').map(item => ({
        codigo: item.codigo,
        cantidad: item.cantidad
      })),
      picking: JSON.parse(storage.getItem(`venta_picking_${venta.id}`) ?? '[]').map(item => ({
        codigo: item.code,
        cantidad: item.quantity
      }))
    }))
  };
}

export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('El archivo no contiene un respaldo JSON válido.');
  }

  if (data?.format !== BACKUP_FORMAT || data.version !== 1 || !Array.isArray(data.pedidos)) {
    throw new Error('El archivo no corresponde a un respaldo de Venta Nacional.');
  }

  for (const pedido of data.pedidos) {
    if (typeof pedido.name !== 'string' || !pedido.name.trim() || !Array.isArray(pedido.items)) {
      throw new Error('El respaldo contiene un pedido inválido.');
    }
    for (const item of pedido.items) {
      normalizeCode(item.codigo);
      parseQuantity(item.cantidad);
    }
    if (pedido.picking !== undefined && !Array.isArray(pedido.picking)) {
      throw new Error('El respaldo contiene un picking inválido.');
    }
    for (const item of pedido.picking ?? []) {
      normalizeCode(item.codigo);
      parseQuantity(item.cantidad);
    }
  }
  return data;
}

export function prepareRestore(backup, makeId) {
  return backup.pedidos.map(pedido => {
    const venta = {
      id: makeId(),
      name: pedido.name.trim().toUpperCase(),
      date: typeof pedido.date === 'string' ? pedido.date : new Date().toLocaleDateString('es-CL')
    };
    let items = [];
    for (const item of pedido.items) {
      items = addCode(items, item.codigo, item.cantidad, makeId()).items;
    }
    const picking = (pedido.picking ?? []).map(item => ({
      code: normalizeCode(item.codigo),
      quantity: parseQuantity(item.cantidad)
    }));
    return { venta, items, picking };
  });
}
