import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePickingCsv, physicalByCode } from '../src/utils/picking.js';

test('carga CSV separado por punto y coma y acepta encabezado con tilde', () => {
  assert.deepEqual(parsePickingCsv('\uFEFFCódigo;Cantidad\nA-1;2\nB;3'), [
    { code: 'A-1', quantity: 2 },
    { code: 'B', quantity: 3 }
  ]);
});

test('consolida códigos repetidos del picking', () => {
  assert.deepEqual(parsePickingCsv('codigo,cantidad\na,2\nA,4'), [{ code: 'A', quantity: 6 }]);
});

test('acepta filas y columnas vacías antes de los encabezados exportados', () => {
  const csv = ',,\n,Codigo,Cantidad\n,MNP01,35\n,MNP09,25\n';
  assert.deepEqual(parsePickingCsv(csv), [
    { code: 'MNP01', quantity: 35 },
    { code: 'MNP09', quantity: 25 }
  ]);
});

test('rechaza columnas o cantidades inválidas indicando la fila', () => {
  assert.throws(() => parsePickingCsv('producto,cantidad\nA,2'), /columnas Código y Cantidad/);
  assert.throws(() => parsePickingCsv('codigo,cantidad\nA,0'), /Fila 2/);
});

test('calcula el físico acumulado usando ambos formatos de item', () => {
  const result = physicalByCode([
    { codigo: 'A', cantidad: 2 },
    { code: 'A', quantity: 3 }
  ]);
  assert.equal(result.get('A'), 5);
});
