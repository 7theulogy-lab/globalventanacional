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
  const lines = String(text ?? '').replace(/^\uFEFF/, '').split(/\r?\n/);
  let header = null;
  for (let lineIndex = 0; lineIndex < lines.length && !header; lineIndex += 1) {
    for (const delimiter of [';', ',', '\t']) {
      const headers = parseCsvLine(lines[lineIndex], delimiter).map(headerName);
      const codeIndex = headers.indexOf('codigo');
      const quantityIndex = headers.indexOf('cantidad');
      if (codeIndex >= 0 && quantityIndex >= 0) {
        header = { lineIndex, delimiter, codeIndex, quantityIndex };
        break;
      }
    }
  }
  if (!header) {
    throw new Error('El CSV debe tener las columnas Código y Cantidad.');
  }

  const byCode = new Map();
  for (let index = header.lineIndex + 1; index < lines.length; index += 1) {
    const cells = parseCsvLine(lines[index], header.delimiter);
    if (cells.every(cell => !cell)) continue;
    try {
      const code = normalizeCode(cells[header.codeIndex]);
      const quantity = parseQuantity(cells[header.quantityIndex]);
      const previous = byCode.get(code) ?? 0;
      const total = previous + quantity;
      if (!Number.isSafeInteger(total)) throw new Error('La cantidad total supera el límite permitido.');
      byCode.set(code, total);
    } catch (cause) {
      throw new Error(`Fila ${index + 1}: ${cause.message}`);
    }
  }

  if (!byCode.size) throw new Error('El CSV no contiene códigos para cargar.');
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
