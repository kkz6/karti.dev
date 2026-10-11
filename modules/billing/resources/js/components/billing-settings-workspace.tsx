import { Head, Link, router, usePage } from '@inertiajs/react';
import Heading from '@shared/components/heading';
import { Button } from '@shared/components/ui/button';
import { Label } from '@shared/components/ui/label';
import AppLayout from '@shared/layouts/app-layout';
import type { ReactNode } from 'react';
import { BillingPageContainer } from './billing-page-container';
import { BillingSelect, BillingSelectItem } from './billing-select';
export function BillingSettingsWorkspace({
    section,
    children,
}: {
    section: 'company' | 'automation' | 'online' | 'imports' | 'taxes';
    children: ReactNode;
}) {
    const { billingAccess } = usePage<{ billingAccess: { viewSettings: boolean; viewImports: boolean; viewTaxRates: boolean } }>().props;
    const sections = [
        { id: 'company', title: 'Company & invoices', visible: billingAccess?.viewSettings },
        { id: 'taxes', title: 'Tax presets', visible: billingAccess?.viewTaxRates },
        { id: 'automation', title: 'Reminders', visible: billingAccess?.viewSettings },
        { id: 'online', title: 'Online payments', visible: billingAccess?.viewSettings },
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
            <BillingPageContainer>
                <Heading title="Billing settings" description="Manage your company and billing preferences" />
                <div className="flex min-w-0 flex-col gap-8 lg:flex-row lg:gap-12">
                    <aside className="w-full lg:w-48 lg:shrink-0">
                        <nav aria-label="Billing settings sections" className="hidden flex-col gap-1 lg:flex">
                            {sections.map((s) => (
                                <Button
                                    key={s.id}
                                    size="sm"
                                    variant={section === s.id ? 'secondary' : 'ghost'}
                                    asChild
                                    className="w-full justify-start"
                                >
                                    <Link
                                        href={route('admin.settings.billing.edit', { section: s.id })}
                                        aria-current={section === s.id ? 'page' : undefined}
                                    >
                                        {s.title}
                                    </Link>
                                </Button>
                            ))}
                        </nav>
                        <div className="space-y-2 lg:hidden">
                            <Label htmlFor="billing-settings-section">Settings section</Label>
                            <BillingSelect
                                id="billing-settings-section"
                                value={section}
                                onValueChange={(value) => router.visit(route('admin.settings.billing.edit', { section: value }))}
                            >
                                {sections.map((s) => (
                                    <BillingSelectItem key={s.id} value={s.id}>
                                        {s.title}
                                    </BillingSelectItem>
                                ))}
                            </BillingSelect>
                        </div>
                    </aside>
                    <section className="min-w-0 flex-1 space-y-8">{children}</section>
                </div>
            </BillingPageContainer>
        </AppLayout>
    );
}
