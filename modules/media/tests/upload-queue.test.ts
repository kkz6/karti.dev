import assert from 'node:assert/strict';
import test from 'node:test';
import { confirmedUpload, createUploadQueue, normalizeUploadPath } from '../resources/js/utils/upload-queue.ts';

const tick = () => new Promise((resolve) => setImmediate(resolve));

test('batches run at most two uploads at once and continue after a failure', async () => {
    const queue = createUploadQueue(2);
    const starts: number[] = [];
    const releases: Array<() => void> = [];
    for (let i = 0; i < 6; i++) {
        queue.add(async () => {
            starts.push(i);
            await new Promise<void>((resolve) => releases.push(resolve));
            if (i === 1) throw new Error('One file failed');
        });
    }
    assert.deepEqual(starts, [0, 1]);
    releases[1]();
    await tick();
    assert.deepEqual(starts, [0, 1, 2]);
    releases[0]();
    await tick();
    assert.deepEqual(starts, [0, 1, 2, 3]);
    releases[2]();
    releases[3]();
    await tick();
    assert.deepEqual(starts, [0, 1, 2, 3, 4, 5]);
    releases[4]();
    releases[5]();
    await tick();
});

test('clearing pending tasks prevents uploads after the uploader closes', async () => {
    const queue = createUploadQueue(1);
    let release!: () => void;
    let started = 0;
    queue.add(async () => {
        started++;
        await new Promise<void>((resolve) => {
            release = resolve;
        });
    });
    queue.add(async () => {
        started++;
    });
    queue.clear();
    release();
    await tick();
    assert.equal(started, 1);
});

test('queued files keep the captured destination while later files can target another folder', async () => {
    const queue = createUploadQueue(1);
    const destinations: string[] = [];
    let release!: () => void;
    queue.add(async () => {
        await new Promise<void>((resolve) => {
            release = resolve;
        });
    });
    let currentFolder = 'photos/Japan Images';
    const enqueue = () => {
        const destination = normalizeUploadPath(currentFolder);
        queue.add(async () => {
            destinations.push(destination);
        });
    };
    enqueue();
    enqueue();
    currentFolder = 'photos/Other';
    enqueue();
    release();
    await tick();
    assert.deepEqual(destinations, ['photos/Japan Images', 'photos/Japan Images', 'photos/Other']);
});

test('only a media response in the requested destination is considered a successful upload', () => {
    const asset = { id: '123', url: '/storage/photos/test.jpg', directory: 'photos' };
    assert.equal(confirmedUpload([asset], '/photos/'), asset);
    assert.equal(normalizeUploadPath('/'), '');
    for (const data of ['<html>Login</html>', {}, [], { success: true }, { ...asset, directory: '' }]) {
        assert.throws(() => confirmedUpload(data, 'photos'), /did not confirm/);
    }
});
