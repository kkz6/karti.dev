import { Head, usePage } from '@inertiajs/react';
import { SettingsWorkspace } from '@shared/components/settings-workspace';
import AppLayout from '@shared/layouts/app-layout';
import { accessibleBillingSettingsSections } from '@shared/lib/billing-settings-sections';
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
    const sections = accessibleBillingSettingsSections(billingAccess);
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
