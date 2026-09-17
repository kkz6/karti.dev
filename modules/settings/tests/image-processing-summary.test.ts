import assert from 'node:assert/strict';
import test from 'node:test';
import { compressionSummary } from '../../../resources/js/pages/settings/image-processing-summary.ts';

test('reads configured quality values rather than hardcoding the defaults', () => {
    assert.equal(compressionSummary('Jpegoptim', ['--max=72']).value, '72%');
    assert.equal(compressionSummary('Pngquant', ['--quality=65-85']).value, '65-85%');
    assert.equal(compressionSummary('Cwebp', ['-q 82', '-m 5', '-pass 8']).value, '82%');
    assert.equal(compressionSummary('Cwebp', ['-q 82', '-m 5', '-pass 8']).note, 'Encoding method: 5 · Passes: 8');
});

test('shows optimization levels and AVIF quantizers without mislabeling them as percentages', () => {
    assert.equal(compressionSummary('Optipng', ['-o2']).value, '2');
    assert.equal(compressionSummary('Gifsicle', ['-O3']).value, '3');
    assert.equal(compressionSummary('Avifenc', ['-a cq-level=23']).value, '23');
    assert.equal(compressionSummary('Avifenc', ['-a cq-level=23']).setting, 'Quantizer');
});

test('does not invent values for missing or custom optimizer settings', () => {
    assert.equal(compressionSummary('Jpegoptim', []).value, 'Tool default');
    assert.equal(compressionSummary('CustomOptimizer', ['--custom']).value, 'Custom');
    assert.equal(compressionSummary('Jpegoptim', ['--max=85', '--strip-all', '--all-progressive']).note, 'Progressive loading · Metadata removed');
});
