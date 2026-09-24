import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../../../resources/js/pages/settings/email.tsx', import.meta.url), 'utf8');
const controller = readFileSync(new URL('../src/Http/Controllers/EmailSettingsController.php', import.meta.url), 'utf8');
const settings = readFileSync(new URL('../src/Settings/EmailSettings.php', import.meta.url), 'utf8');

test('email settings present responsive SMTP and Resend provider forms', () => {
    assert.match(page, /PageContainer/);
    assert.match(page, /Use a custom email provider/);
    assert.match(page, /Delivery provider/);
    assert.match(page, /SMTP server/);
    assert.match(page, /Resend API/);
    assert.match(page, /Sender identity/);
    assert.match(page, /STARTTLS \/ automatic/);
});

test('provider credentials are encrypted and write-only', () => {
    assert.match(settings, /#\[ShouldBeEncrypted\]/);
    assert.match(controller, /Arr::except\(\$settings->toArray\(\), \['password', 'resend_api_key'\]\)/);
    assert.match(page, /Saved password — enter a new one to replace it/);
    assert.match(page, /Saved API key — enter a new one to replace it/);
});

test('saved provider settings can send a real test email', () => {
    assert.match(page, /Test delivery/);
    assert.match(page, /admin\.settings\.email\.test/);
    assert.match(page, /Save your changes before testing/);
    assert.match(controller, /EmailDeliveryTest/);
});
