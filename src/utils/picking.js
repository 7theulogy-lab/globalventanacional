import { normalizeCode, parseQuantity } from './inventory.js';

function parseCsvLine(line, delimiter) {
  const cells = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      cells.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }
  if (quoted) throw new Error('El CSV contiene comillas sin cerrar.');
  cells.push(value.trim());
  return cells;
}

function headerName(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

export function parsePickingCsv(text) {
  const lines = String(text ?? '').replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) throw new Error('El CSV debe incluir encabezados y al menos una fila.');

  const delimiter = [';', ',', '\t'].reduce((best, candidate) =>
    lines[0].split(candidate).length > lines[0].split(best).length ? candidate : best
  , ';');
  const headers = parseCsvLine(lines[0], delimiter).map(headerName);
  const codeIndex = headers.indexOf('codigo');
  const quantityIndex = headers.indexOf('cantidad');
  if (codeIndex < 0 || quantityIndex < 0) {
    throw new Error('El CSV debe tener las columnas Código y Cantidad.');
  }

  const byCode = new Map();
  for (let index = 1; index < lines.length; index += 1) {
    const cells = parseCsvLine(lines[index], delimiter);
    try {
      const code = normalizeCode(cells[codeIndex]);
      const quantity = parseQuantity(cells[quantityIndex]);
      const previous = byCode.get(code) ?? 0;
      const total = previous + quantity;
      if (!Number.isSafeInteger(total)) throw new Error('La cantidad total supera el límite permitido.');
      byCode.set(code, total);
    } catch (cause) {
      throw new Error(`Fila ${index + 1}: ${cause.message}`);
    }
  }

  return [...byCode].map(([code, quantity]) => ({ code, quantity }));
}

export function physicalByCode(items) {
  const result = new Map();
  for (const item of items) {
    const code = normalizeCode(item.code ?? item.codigo);
    const quantity = Number(item.quantity ?? item.cantidad);
    result.set(code, (result.get(code) ?? 0) + quantity);
  }
  return result;
}
