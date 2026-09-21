import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const loginPage = readFileSync(new URL('../../auth/resources/js/pages/login.tsx', import.meta.url), 'utf8');

test('invalid credentials are visible beside the password field', () => {
    assert.match(loginPage, /<InputError id="password-error" message=\{errors\.password \|\| errors\.email\} \/>/);
    assert.match(loginPage, /aria-invalid=\{Boolean\(errors\.password \|\| errors\.email\)\}/);
    assert.match(loginPage, /aria-describedby=\{errors\.password \|\| errors\.email \? 'password-error' : undefined\}/);
});
