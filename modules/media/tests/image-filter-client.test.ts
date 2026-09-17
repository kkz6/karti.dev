import assert from 'node:assert/strict';
import test from 'node:test';
import { ImageFilterClient } from '../resources/js/utils/image-filter-client.ts';

class WorkerMock {
    static current: WorkerMock;
    messages: { id: number; type: string; preview?: boolean }[] = [];
    terminated = false;
    onmessage?: (event: { data: { id: number; blob?: Blob; error?: string } }) => void;
    onerror?: () => void;
    onmessageerror?: () => void;
    constructor() {
        WorkerMock.current = this;
    }
    postMessage(message: { id: number; type: string; preview?: boolean }) {
        this.messages.push(message);
    }
    terminate() {
        this.terminated = true;
    }
}
Object.defineProperty(globalThis, 'Worker', { value: WorkerMock, configurable: true });

test('worker responses resolve their matching request and distinguish preview from export', async () => {
    const client = new ImageFilterClient();
    const worker = WorkerMock.current;
    const preview = client.render({ hue: 45 });
    const exported = client.render({ hue: 45 }, false);
    assert.equal(worker.messages[0].preview, true);
    assert.equal(worker.messages[1].preview, false);
    const png = new Blob(['export'], { type: 'image/png' });
    const jpeg = new Blob(['preview'], { type: 'image/jpeg' });
    worker.onmessage?.({ data: { id: worker.messages[1].id, blob: png } });
    worker.onmessage?.({ data: { id: worker.messages[0].id, blob: jpeg } });
    assert.equal(await preview, jpeg);
    assert.equal(await exported, png);
    client.dispose();
});

test('closing terminates the worker and rejects outstanding requests', async () => {
    const client = new ImageFilterClient();
    const pending = assert.rejects(client.render({ hue: 10 }), /closed/);
    client.dispose();
    await pending;
    assert.equal(WorkerMock.current.terminated, true);
    await assert.rejects(client.render({ hue: 20 }), /closed/);
});

test('worker failure rejects instead of leaving the loading UI stuck', async () => {
    const client = new ImageFilterClient();
    const pending = assert.rejects(client.render({ hue: 10 }), /unavailable/);
    WorkerMock.current.onerror?.();
    await pending;
    assert.equal(WorkerMock.current.terminated, true);
});

test('a stalled worker times out and frees outstanding requests', async (context) => {
    context.mock.timers.enable({ apis: ['setTimeout'] });
    const client = new ImageFilterClient();
    const pending = assert.rejects(client.render({ hue: 10 }), /timed out/);
    context.mock.timers.tick(60000);
    await pending;
    assert.equal(WorkerMock.current.terminated, true);
});
