import assert from 'node:assert/strict';
import test from 'node:test';
import { accessibleBillingSettingsSections } from '../resources/js/lib/billing-settings-sections.ts';

test('restricted billing menus expose only the granted tax and import areas', () => {
    assert.deepEqual(
        accessibleBillingSettingsSections().map((section) => section.id),
        [],
    );
    assert.deepEqual(
        accessibleBillingSettingsSections({ viewSettings: false, viewImports: false, viewTaxRates: true }).map((section) => section.id),
        ['taxes'],
    );
    assert.deepEqual(
        accessibleBillingSettingsSections({ viewSettings: false, viewImports: true, viewTaxRates: false }).map((section) => section.id),
        ['imports'],
    );
    const manager = accessibleBillingSettingsSections({ viewSettings: true, viewImports: false, viewTaxRates: false }).map((section) => section.id);
    assert(manager.includes('company') && manager.includes('invoices') && manager.includes('online'));
    assert(!manager.includes('taxes') && !manager.includes('imports'));
});
