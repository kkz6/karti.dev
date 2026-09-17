import assert from 'node:assert/strict';
import test from 'node:test';
import { hasImageTransform, imageExportBounds } from '../resources/js/utils/image-export.ts';

test('fitting and panning preserve the full-resolution export', () => {
    const matrix = [0.5, 0, 0, 0.5, 40, 60];
    assert.deepEqual(imageExportBounds(1200, 800, matrix), {
        x: 340,
        y: 260,
        width: 600,
        height: 400,
        outputWidth: 1200,
        outputHeight: 800,
    });
    assert.equal(hasImageTransform(matrix), false);
});

test('rotation swaps dimensions and flipping preserves them', () => {
    const rotated = imageExportBounds(1200, 800, [0, 0.5, -0.5, 0, 0, 0]);
    assert.equal(rotated.outputWidth, 800);
    assert.equal(rotated.outputHeight, 1200);
    const flipped = imageExportBounds(1200, 800, [-0.5, 0, 0, 0.5, 0, 0]);
    assert.equal(flipped.outputWidth, 1200);
    assert.equal(flipped.outputHeight, 800);
    assert.equal(hasImageTransform([-0.5, 0, 0, 0.5, 0, 0]), true);
    assert.equal(hasImageTransform([0, 0.5, -0.5, 0, 0, 0]), true);
});

test('crop coordinates convert from viewport pixels to source resolution', () => {
    const crop = { x: 30, y: 20, width: 150, height: 100 };
    assert.deepEqual(imageExportBounds(1200, 800, [0.25, 0, 0, 0.25, 0, 0], crop), {
        ...crop,
        outputWidth: 600,
        outputHeight: 400,
    });
});

test('floating-point full rotations are not treated as edits', () => {
    assert.equal(hasImageTransform([0.5, -1e-16, 1e-16, 0.5, 35, 90]), false);
    assert.throws(() => imageExportBounds(1200, 800, [0, 0, 0, 0, 0, 0]), /Invalid image scale/);
});
