import test from 'node:test';
import assert from 'node:assert/strict';
import { addCode, editCode, consolidateItems, parseQuantity } from '../src/utils/inventory.js';

test('suma un código repetido sin mutar los datos anteriores', () => {
  const original = [{ id: 'a', codigo: 'A', cantidad: 2 }];
  const result = addCode(original, ' a ', '3', 'nuevo');

  assert.deepEqual(result.items, [{ id: 'a', codigo: 'A', cantidad: 5 }]);
  assert.equal(original[0].cantidad, 2);
  assert.equal(result.merged, true);
});

test('al corregir A1 a A fusiona las cantidades y elimina A1', () => {
  const items = [
    { id: 'a1', codigo: 'A1', cantidad: 4 },
    { id: 'a', codigo: 'A', cantidad: 2 }
  ];
  const result = editCode(items, 'a1', 'a', '4');

  assert.deepEqual(result.items, [{ id: 'a', codigo: 'A', cantidad: 6 }]);
  assert.equal(result.merged, true);
});

test('una edición normal conserva el identificador', () => {
  const result = editCode([{ id: 'x', codigo: 'X', cantidad: 1 }], 'x', 'y', '2');
  assert.deepEqual(result.items, [{ id: 'x', codigo: 'Y', cantidad: 2 }]);
});

test('rechaza cantidades inválidas, exponentes y números demasiado grandes', () => {
  for (const value of ['0', '-1', '1.5', '1e2', '', '9007199254740992']) {
    assert.throws(() => parseQuantity(value));
  }
  assert.equal(parseQuantity('12'), 12);
});

test('impide que una suma desborde los enteros seguros', () => {
  assert.throws(() => addCode(
    [{ id: 'a', codigo: 'A', cantidad: Number.MAX_SAFE_INTEGER }],
    'A', '1', 'nuevo'
  ));
});

test('consolida duplicados que quedaron guardados por versiones anteriores', () => {
  const oldItems = [
    { id: 'first', codigo: 'A', cantidad: 2 },
    { id: 'second', codigo: 'a', cantidad: 4 },
    { id: 'third', codigo: 'B', cantidad: 1 }
  ];
  const result = consolidateItems(oldItems);
  assert.equal(result.changed, true);
  assert.deepEqual(result.items, [
    { id: 'first', codigo: 'A', cantidad: 6 },
    { id: 'third', codigo: 'B', cantidad: 1 }
  ]);
});
