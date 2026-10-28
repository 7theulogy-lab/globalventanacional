export function normalizeCode(value) {
  const code = String(value ?? '').trim().toUpperCase();
  if (!code) throw new Error('Ingresa un código válido.');
  return code;
}

export function parseQuantity(value) {
  const text = String(value ?? '').trim();
  if (!/^\d+$/.test(text)) throw new Error('La cantidad debe ser un número entero positivo.');

  const quantity = Number(text);
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new Error('La cantidad debe ser un número entero positivo.');
  }
  return quantity;
}

function sumQuantities(a, b) {
  const total = a + b;
  if (!Number.isSafeInteger(total)) throw new Error('La cantidad total supera el límite permitido.');
  return total;
}

export function addCode(items, rawCode, rawQuantity, id) {
  const code = normalizeCode(rawCode);
  const quantity = parseQuantity(rawQuantity);
  const existing = items.find(item => normalizeCode(item.codigo) === code);

  if (existing) {
    const nextQuantity = sumQuantities(existing.cantidad, quantity);
    return {
      items: items.map(item => item.id === existing.id ? { ...item, cantidad: nextQuantity } : item),
      code,
      previousQuantity: existing.cantidad,
      nextQuantity,
      merged: true
    };
  }

  return {
    items: [{ id, codigo: code, cantidad: quantity }, ...items],
    code,
    previousQuantity: 0,
    nextQuantity: quantity,
    merged: false
  };
}

export function editCode(items, editedId, rawCode, rawQuantity) {
  const code = normalizeCode(rawCode);
  const quantity = parseQuantity(rawQuantity);
  const edited = items.find(item => item.id === editedId);
  if (!edited) throw new Error('El código ya no existe. Actualiza el pedido.');

  const existing = items.find(item => item.id !== editedId && normalizeCode(item.codigo) === code);
  if (existing) {
    const nextQuantity = sumQuantities(existing.cantidad, quantity);
    return {
      items: items.filter(item => item.id !== editedId).map(item =>
        item.id === existing.id ? { ...item, cantidad: nextQuantity } : item
      ),
      code,
      previousQuantity: existing.cantidad,
      nextQuantity,
      merged: true
    };
  }

  return {
    items: items.map(item => item.id === editedId ? { ...item, codigo: code, cantidad: quantity } : item),
    code,
    previousQuantity: edited.cantidad,
    nextQuantity: quantity,
    merged: false
  };
}

export function consolidateItems(items) {
  const result = [];
  let changed = false;

  for (const item of items) {
    const code = normalizeCode(item.codigo);
    const quantity = parseQuantity(item.cantidad);
    const existingIndex = result.findIndex(entry => entry.codigo === code);
    if (existingIndex >= 0) {
      result[existingIndex] = {
        ...result[existingIndex],
        cantidad: sumQuantities(result[existingIndex].cantidad, quantity)
      };
      changed = true;
    } else {
      result.push({ ...item, codigo: code, cantidad: quantity });
      if (item.codigo !== code || item.cantidad !== quantity) changed = true;
    }
  }

  return { items: changed ? result : items, changed };
}
