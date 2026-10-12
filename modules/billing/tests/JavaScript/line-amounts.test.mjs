import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('../../resources/js/lib/line-amounts.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } });
const { lineAmounts } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const line = (key, quantity, rate, taxes = []) => ({ key, quantity, rate, taxes, description: '' });
const data = (items, discount_mode = 'none', discount_value = '0') => ({ items, discount_mode, discount_value });

test('amount updates without customer details or descriptions and ignores unfinished sibling prices', () => {
    assert.deepEqual(lineAmounts(data([line('a', '1', '100'), line('b', '1', '')]), 2), { a: '100.00' });
    assert.deepEqual(lineAmounts(data([line('a', '2.5', '100')]), 2), { a: '250.00' });
});
test('matches server half-up precision and discounts plus multiple taxes', () => {
    assert.deepEqual(lineAmounts(data([line('a', '1', '2500', [{ percentage: '9' }, { percentage: '9' }])], 'percent', '10'), 2), { a: '2655.00' });
    assert.deepEqual(lineAmounts(data([line('a', '1', '0.105')]), 2), { a: '0.11' });
    assert.deepEqual(lineAmounts(data([line('a', '1', '100.5')]), 0), { a: '101' });
    assert.deepEqual(lineAmounts(data([line('a', '1', '0.1005')]), 3), { a: '0.101' });
});
test('fixed discount remainder follows item key and stays stable on reorder', () => {
    const a = line('a', '1', '1'),
        b = line('b', '1', '1'),
        c = line('c', '1', '1');
    assert.deepEqual(lineAmounts(data([a, b, c], 'fixed', '0.01'), 2), { a: '0.99', b: '1.00', c: '1.00' });
    assert.deepEqual(lineAmounts(data([c, a, b], 'fixed', '0.01'), 2), { c: '1.00', a: '0.99', b: '1.00' });
});
test('invalid or excessive numeric inputs do not show misleading totals', () => {
    assert.deepEqual(lineAmounts(data([line('a', '0', '100'), line('b', '1', '-1'), line('c', '1', '1', [{ percentage: '101' }])]), 2), {});
    assert.deepEqual(lineAmounts(data([line('a', '1', '100')], 'fixed', '101'), 2), {});
    assert.deepEqual(lineAmounts(data([line('a', '1', '100')], 'fixed', '0.001'), 2), {});
    assert.deepEqual(lineAmounts(data([line('a', '999999999', '999999999')]), 2), {});
});
