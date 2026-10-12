import { Head, usePage } from '@inertiajs/react';
import { SettingsWorkspace } from '@shared/components/settings-workspace';
import AppLayout from '@shared/layouts/app-layout';
import { SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
export function BillingSettingsWorkspace({
    section,
    children,
}: {
    section: 'company' | 'invoices' | 'automation' | 'online' | 'imports' | 'taxes' | 'delivery' | 'payments';
    children: ReactNode;
}) {
    const { billingAccess } = usePage<{ billingAccess: { viewSettings: boolean; viewImports: boolean; viewTaxRates: boolean } }>().props;
    const sections = [
        { id: 'company', title: 'Company', visible: billingAccess?.viewSettings },
        { id: 'invoices', title: 'Invoice settings', visible: billingAccess?.viewSettings },
        { id: 'taxes', title: 'Tax presets', visible: billingAccess?.viewTaxRates },
        { id: 'payments', title: 'Payment methods', visible: billingAccess?.viewSettings },
        { id: 'online', title: 'Online payments', visible: billingAccess?.viewSettings },
        { id: 'delivery', title: 'Email & SMS', visible: billingAccess?.viewSettings },
        { id: 'automation', title: 'Reminders & receipts', visible: billingAccess?.viewSettings },
        { id: 'imports', title: 'Data imports', visible: billingAccess?.viewImports },
    ].filter((s) => s.visible);
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Billing settings', href: route('admin.settings.billing.edit') },
                { title: sections.find((s) => s.id === section)?.title ?? 'Settings', href: route('admin.settings.billing.edit', { section }) },
            ]}
        >
            <Head title="Billing settings" />
            <SettingsWorkspace
                title="Billing settings"
                icon={SlidersHorizontal}
                selected={section}
                sections={sections.map((item) => ({ ...item, href: route('admin.settings.billing.edit', { section: item.id }) }))}
            >
                {children}
            </SettingsWorkspace>
        </AppLayout>
    );
}
