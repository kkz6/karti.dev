import assert from 'node:assert/strict';
import test from 'node:test';
import { ImageFilterProcessor } from '../resources/js/utils/imageFilters.ts';

// Minimal canvas boundary; actual worker/encoder integration is checked in the browser.
class TestImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(data: Uint8ClampedArray, width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
    }
}
Object.defineProperty(globalThis, 'ImageData', { value: TestImageData, configurable: true });

function processorFor(pixels: number[], width = 1, height = 1) {
    let output = new TestImageData(new Uint8ClampedArray(pixels), width, height);
    const original = output;
    const context = {
        drawImage() {},
        getImageData: () => original,
        putImageData: (data: TestImageData) => {
            output = data;
        },
    };
    const canvas = {
        width,
        height,
        getContext: () => context,
        convertToBlob: async (options: { type: string }) => new Blob([output.data], { type: options.type }),
    };
    const processor = new ImageFilterProcessor(canvas as unknown as OffscreenCanvas);
    processor.loadBitmap({ width, height } as ImageBitmap);
    return { processor, pixels: () => [...output.data], original };
}

test('preview encoding is fast for opaque images while exports remain lossless', async () => {
    const { processor } = processorFor([120, 70, 25, 255]);
    assert.equal((await processor.renderBlob({ hue: 40 })).type, 'image/jpeg');
    assert.equal((await processor.renderBlob({ hue: 40 }, false)).type, 'image/png');
});

test('transparent previews keep alpha and use PNG', async () => {
    const state = processorFor([120, 70, 25, 80]);
    assert.equal((await state.processor.renderBlob({ brightness: 10 })).type, 'image/png');
    assert.equal(state.pixels()[3], 80);
});

test('new adjustments always start from original pixels rather than the previous preview', async () => {
    const state = processorFor([120, 70, 25, 255]);
    await state.processor.renderBlob({ brightness: 10 });
    const first = state.pixels();
    await state.processor.renderBlob({ brightness: 10 });
    assert.deepEqual(state.pixels(), first);
    await state.processor.renderBlob({});
    assert.deepEqual(state.pixels(), [120, 70, 25, 255]);
});

test('optimized hue matches the original coefficients', async () => {
    for (const angle of [1, 45, 100, 350]) {
        const [r, g, b] = [120, 70, 25];
        const cos = Math.cos((angle * Math.PI) / 180),
            sin = Math.sin((angle * Math.PI) / 180);
        const expected = new Uint8ClampedArray([
            (0.299 + 0.701 * cos + 0.168 * sin) * r + (0.587 - 0.587 * cos + 0.33 * sin) * g + (0.114 - 0.114 * cos - 0.497 * sin) * b,
            (0.299 - 0.299 * cos - 0.328 * sin) * r + (0.587 + 0.413 * cos + 0.035 * sin) * g + (0.114 - 0.114 * cos + 0.292 * sin) * b,
            (0.299 - 0.3 * cos + 1.25 * sin) * r + (0.587 - 0.588 * cos - 1.05 * sin) * g + (0.114 + 0.886 * cos - 0.203 * sin) * b,
            255,
        ]);
        const state = processorFor([r, g, b, 255]);
        await state.processor.renderBlob({ hue: angle });
        assert.deepEqual(state.pixels(), [...expected]);
    }
});

test('vibrance is applied and sharpening does not erase border pixels', async () => {
    const state = processorFor([120, 70, 25, 255]);
    await state.processor.renderBlob({ vibrance: 50 });
    assert.notDeepEqual(state.pixels(), [120, 70, 25, 255]);
    await state.processor.renderBlob({ clarity: true });
    assert.equal(state.pixels()[3], 255);
});

test('grain presets regenerate the same pixels for preview and lossless export', async () => {
    const state = processorFor([120, 70, 25, 255, 65, 100, 80, 255], 2, 1);
    await state.processor.renderBlob({ grungy: true });
    const previewPixels = state.pixels();
    await state.processor.renderBlob({ grungy: true }, false);
    assert.deepEqual(state.pixels(), previewPixels);
});
