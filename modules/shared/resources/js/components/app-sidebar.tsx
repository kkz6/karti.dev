import { usePage } from '@inertiajs/react';
import { NavMain } from '@shared/components/nav-main';
import { Sidebar, SidebarContent } from '@shared/components/ui/sidebar';
import { mainNavGroups } from '@shared/config/navigation';
import { accessibleBillingSettingsSections } from '@shared/lib/billing-settings-sections';

export function AppSidebar() {
    const { billingAccess } = usePage<{
        billingAccess: {
            viewCustomers: boolean;
            viewInvoices: boolean;
            viewPayments: boolean;
            viewRecurring: boolean;
            viewReconciliation: boolean;
            viewCredits: boolean;
            viewImports: boolean;
            viewTaxRates: boolean;
            viewSettings: boolean;
        };
    }>().props;
    const access: Record<string, boolean> = {
        Customers: billingAccess?.viewCustomers ?? false,
        'Billing imports': billingAccess?.viewImports ?? false,
        'Credit notes': billingAccess?.viewCredits ?? false,
        'Online payment settings': billingAccess?.viewSettings ?? false,
        'Payment reconciliation': billingAccess?.viewReconciliation ?? false,
        'Recurring invoices': billingAccess?.viewRecurring ?? false,
        Payments: billingAccess?.viewPayments ?? false,
        Invoices: billingAccess?.viewInvoices ?? false,
        'Tax presets': billingAccess?.viewTaxRates ?? false,
        'Billing automation': billingAccess?.viewSettings ?? false,
        'Billing settings': (billingAccess?.viewSettings || billingAccess?.viewImports || billingAccess?.viewTaxRates) ?? false,
    };
    const allowedBillingSections = new Set<string>(accessibleBillingSettingsSections(billingAccess).map((section) => section.title));
    const groups = mainNavGroups
        .map((group) => ({
            ...group,
            items: group.items
                .filter((item) => access[item.title] ?? true)
                .map((item) =>
                    item.title === 'Billing settings'
                        ? {
                              ...item,
                              items: item.items?.filter((child) => allowedBillingSections.has(child.title)),
                          }
                        : item,
                ),
        }))
        .filter((group) => group.items.length > 0);
    return (
        <Sidebar collapsible="icon" position="relative">
            <SidebarContent className="py-4">
                <NavMain groups={groups} />
            </SidebarContent>
        </Sidebar>
    );
}
