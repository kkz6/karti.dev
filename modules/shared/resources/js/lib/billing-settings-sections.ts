export const billingSettingsSections = [
    { id: 'company', title: 'Company', access: 'viewSettings' },
    { id: 'invoices', title: 'Invoice settings', access: 'viewSettings' },
    { id: 'taxes', title: 'Tax presets', access: 'viewTaxRates' },
    { id: 'payments', title: 'Payment methods', access: 'viewSettings' },
    { id: 'online', title: 'Online payments', access: 'viewSettings' },
    { id: 'delivery', title: 'Email & SMS', access: 'viewSettings' },
    { id: 'automation', title: 'Reminders & receipts', access: 'viewSettings' },
    { id: 'imports', title: 'Data imports', access: 'viewImports' },
] as const;

export function accessibleBillingSettingsSections(access?: { viewSettings: boolean; viewTaxRates: boolean; viewImports: boolean }) {
    return billingSettingsSections.filter((section) => access?.[section.access]);
}
