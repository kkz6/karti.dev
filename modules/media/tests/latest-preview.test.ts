import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as pause } from 'node:timers/promises';
import { LatestPreview } from '../resources/js/utils/latest-preview.ts';

function setup() {
    const started: number[] = [],
        committed: number[] = [],
        busy: boolean[] = [],
        errors: unknown[] = [];
    const requests: { resolve: (value: number) => void; reject: (error: Error) => void }[] = [];
    const queue = new LatestPreview<number, number>({
        delay: 0,
        render: (value) => {
            started.push(value);
            return new Promise((resolve, reject) => requests.push({ resolve, reject }));
        },
        commit: async (value) => {
            committed.push(value);
        },
        busy: (value) => {
            busy.push(value);
        },
        error: (error) => {
            errors.push(error);
        },
    });
    return { queue, started, committed, busy, errors, requests };
}

test('rapid slider input coalesces into the latest value', async () => {
    const state = setup();
    for (let i = 0; i < 100; i++) state.queue.schedule(i);
    await pause(5);
    assert.deepEqual(state.started, [99]);
    state.requests[0].resolve(99);
    await pause(5);
    assert.deepEqual(state.committed, [99]);
    assert.equal(state.busy.at(-1), false);
    state.queue.dispose();
});

test('only one render runs at a time and obsolete results never replace the preview', async () => {
    const state = setup();
    state.queue.schedule(1);
    await pause(5);
    state.queue.schedule(2);
    state.queue.schedule(3);
    await pause(5);
    assert.deepEqual(state.started, [1]);
    state.requests[0].resolve(1);
    await pause(5);
    assert.deepEqual(state.committed, []);
    assert.deepEqual(state.started, [1, 3]);
    assert.equal(state.busy.at(-1), true);
    state.requests[1].resolve(3);
    await pause(5);
    assert.deepEqual(state.committed, [3]);
    assert.equal(state.busy.at(-1), false);
    state.queue.dispose();
});

test('reset cancels old output, including an already running render', async () => {
    const state = setup();
    state.queue.schedule(1);
    await pause(5);
    state.queue.cancel();
    state.requests[0].resolve(1);
    await pause(5);
    assert.deepEqual(state.committed, []);
    assert.equal(state.busy.at(-1), false);
    state.queue.dispose();
});

test('closing suppresses pending state updates and stale failures', async () => {
    const state = setup();
    state.queue.schedule(1);
    await pause(5);
    state.queue.dispose();
    const events = state.busy.length;
    state.requests[0].reject(new Error('worker terminated'));
    state.queue.schedule(2);
    await pause(5);
    assert.deepEqual(state.errors, []);
    assert.deepEqual(state.started, [1]);
    assert.equal(state.busy.length, events);
});

test('failed processing clears the loading state and accepts a retry', async () => {
    const state = setup();
    state.queue.schedule(1);
    await pause(5);
    state.requests[0].reject(new Error('Failed'));
    await pause(5);
    assert.equal(state.errors.length, 1);
    assert.equal(state.busy.at(-1), false);
    state.queue.schedule(2);
    await pause(5);
    state.requests[1].resolve(2);
    await pause(5);
    assert.deepEqual(state.committed, [2]);
    state.queue.dispose();
});
