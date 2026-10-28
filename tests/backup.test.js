import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, parseBackup, prepareRestore } from '../src/utils/backup.js';

test('respalda y restaura pedidos sin sobrescribir identificadores actuales', () => {
  const storage = { getItem: () => JSON.stringify([{ codigo: 'A', cantidad: 2 }]) };
  const backup = createBackup([{ id: 'old', name: 'RETAIL', date: '28-10-2026' }], storage);
  const parsed = parseBackup(JSON.stringify(backup));
  let nextId = 0;
  const restored = prepareRestore(parsed, () => `new-${++nextId}`);

  assert.equal(restored[0].venta.id, 'new-1');
  assert.deepEqual(restored[0].items, [{ id: 'new-2', codigo: 'A', cantidad: 2 }]);
});

test('rechaza archivos ajenos o cantidades inválidas', () => {
  assert.throws(() => parseBackup('{'));
  assert.throws(() => parseBackup(JSON.stringify({ format: 'otro', version: 1, pedidos: [] })));
  assert.throws(() => parseBackup(JSON.stringify({
    format: 'venta-nacional-backup', version: 1,
    pedidos: [{ name: 'X', items: [{ codigo: 'A', cantidad: 0 }] }]
  })));
});
