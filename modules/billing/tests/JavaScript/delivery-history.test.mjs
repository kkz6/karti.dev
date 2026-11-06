import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

async function source(path) {
    const { outputText } = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 },
    });
    return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { parseRecipients, validEmail } = await source('../../resources/js/lib/recipients.ts');
const { watchDelivery, deliveryTime } = await source('../../resources/js/lib/delivery-history.ts');

test('recipient lists handle paste, display names and case-insensitive duplicates', () => {
    assert.deepEqual(parseRecipients('One <one@example.test>, two@example.test; ONE@example.test\nthree@example.test'), [
        'ONE@example.test',
        'two@example.test',
        'three@example.test',
    ]);
    assert.equal(validEmail('one@example.test'), true);
    for (const email of ['bad', 'a@@b.test', '<a@b.test>', 'a b@test.test']) assert.equal(validEmail(email), false);
});

test('delivery updates do not subscribe without broadcasting or a configured client', () => {
    assert.equal(
        watchDelivery(undefined, true, 1, () => {}),
        undefined,
    );
    assert.equal(
        watchDelivery(
            {
                private: () => {
                    throw Error('must not subscribe');
                },
            },
            false,
            1,
            () => {},
        ),
        undefined,
    );
});

test('delivery updates use an invoice channel and remove their listener on cleanup', () => {
    let callback;
    let refreshed = 0;
    let cleaned = false;
    const cleanup = watchDelivery(
        {
            private: (name) => {
                assert.equal(name, 'billing.invoices.17');
                return {
                    listen: (event, listener) => {
                        assert.equal(event, '.invoice.delivery.updated');
                        callback = listener;
                    },
                    stopListening: (event, listener) => {
                        assert.equal(event, '.invoice.delivery.updated');
                        assert.equal(listener, callback);
                        cleaned = true;
                    },
                };
            },
        },
        true,
        17,
        () => refreshed++,
    );
    callback();
    assert.equal(refreshed, 1);
    cleanup();
    assert.equal(cleaned, true);
});

test('delivery dates show a readable date and local time without raw ISO fractions', () => {
    const formatted = deliveryTime('2026-11-06T11:27:34.000000Z');
    assert.match(formatted, /6 Nov 2026/);
    assert.doesNotMatch(formatted, /T11:|000000Z/);
    assert.equal(deliveryTime('not-a-date'), 'Time unavailable');
});
