import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../../../resources/js/pages/settings/email.tsx', import.meta.url), 'utf8');
const controller = readFileSync(new URL('../src/Http/Controllers/EmailSettingsController.php', import.meta.url), 'utf8');
const settings = readFileSync(new URL('../src/Settings/EmailSettings.php', import.meta.url), 'utf8');

test('email settings present a dedicated responsive SMTP form', () => {
    assert.match(page, /PageContainer/);
    assert.match(page, /Use custom SMTP settings/);
    assert.match(page, /SMTP server/);
    assert.match(page, /Sender identity/);
    assert.match(page, /STARTTLS \/ automatic/);
});

test('SMTP passwords are encrypted and write-only', () => {
    assert.match(settings, /#\[ShouldBeEncrypted\]/);
    assert.match(controller, /Arr::except\(\$settings->toArray\(\), \['password'\]\)/);
    assert.match(page, /Saved password — enter a new one to replace it/);
});
