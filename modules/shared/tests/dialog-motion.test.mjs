import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('confirmation dialogs fade in place without sliding away from their centered position', () => {
    const source = readFileSync(new URL('../resources/js/components/ui/alert-dialog.tsx', import.meta.url), 'utf8');
    assert.match(source, /left-\[50%\] top-\[50%\]/);
    assert.match(source, /translate-x-\[-50%\] translate-y-\[-50%\]/);
    assert.match(source, /data-\[state=open\]:fade-in-0/);
    assert.match(source, /data-\[state=closed\]:fade-out-0/);
    assert.match(source, /motion-reduce:animate-none/);
    assert.doesNotMatch(source, /slide-in-|slide-out-|zoom-in-|zoom-out-/);
});
