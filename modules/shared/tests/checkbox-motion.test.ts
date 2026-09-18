import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('checkbox checkmark animates subtly only when checked and motion is allowed', () => {
    const source = readFileSync(new URL('../resources/js/components/ui/checkbox.tsx', import.meta.url), 'utf8');
    for (const token of [
        'motion-safe:data-[state=checked]:animate-in',
        'motion-safe:data-[state=checked]:fade-in-0',
        'motion-safe:data-[state=checked]:zoom-in-75',
        'motion-safe:duration-150',
        'motion-reduce:transition-none',
    ]) {
        assert.ok(source.includes(token));
    }
    assert.match(source, /props.checked === ['"]indeterminate['"]/);
    assert.match(source, /MinusIcon/);
    assert.match(source, /disabled:cursor-not-allowed/);
});
