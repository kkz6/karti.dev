/** Match index links to their section, but keep individual SEO reports distinct. */
export function isRouteActive(currentRouteName: string | null | undefined, itemHref: string, currentUrl?: string): boolean {
    if (!currentRouteName) return false;

    const link = new URL(itemHref, 'https://navigation.invalid');
    const path = link.pathname.replace(/\/+$/, '');

    if (path === '/admin/seo') return ['admin.seo.index', 'admin.seo.page', 'admin.seo.content'].includes(currentRouteName);
    if (path === '/admin/seo/google') return currentRouteName === 'admin.seo.google';
    if (path === '/dashboard') return currentRouteName === 'dashboard';
    if (path === '/admin/media-manager') return currentRouteName === 'media-manager';
    if (path === '/admin/settings') return ['admin.settings.edit', 'admin.settings.update'].includes(currentRouteName);
    if (path === '/admin/settings/media') return currentRouteName.startsWith('admin.settings.media.');
    if (path === '/admin/settings/protection') return currentRouteName.startsWith('admin.settings.protection.');
    if (path === '/admin/settings/email') return currentRouteName.startsWith('admin.settings.email.');

    if (path === '/admin/settings/billing') {
        const family = [
            ['admin.billing.automation.', 'automation'],
            ['admin.billing.online.', 'online'],
            ['admin.billing.providers.', 'online'],
            ['admin.billing.imports.', 'imports'],
            ['admin.tax-rates.', 'taxes'],
            ['admin.billing.delivery.', 'delivery'],
            ['admin.billing.payment-methods.', 'payments'],
        ].find(([prefix]) => currentRouteName.startsWith(prefix));
        const inBilling =
            currentRouteName.startsWith('admin.settings.billing.') || !!family || currentRouteName.startsWith('admin.billing.providers.');
        const section = link.searchParams.get('section');
        if (!section) return inBilling;
        const selected = currentUrl ? new URL(currentUrl, 'https://navigation.invalid').searchParams.get('section') : null;
        return inBilling && section === (selected ?? family?.[1] ?? 'company');
    }

    const sections: Record<string, string> = {
        '/admin/customers': 'admin.customers',
        '/admin/invoices': 'admin.invoices',
        '/admin/payments': 'admin.payments',
        '/admin/credit-notes': 'admin.credit-notes',
        '/admin/recurring-invoices': 'admin.recurring-invoices',
        '/admin/tax-rates': 'admin.tax-rates',
        '/admin/billing/reconciliation': 'admin.billing.reconciliation',
        '/admin/blog': 'admin.blog',
        '/admin/blog/categories': 'admin.categories',
        '/admin/blog/tags': 'admin.tags',
        '/admin/photography': 'admin.photography',
        '/admin/projects': 'admin.projects',
        '/admin/speaking': 'admin.speaking',
        '/admin/tools': 'admin.tools',
        '/admin/newsletter': 'admin.newsletter',
    };
    const section = sections[path];
    return !!section && (currentRouteName === section || currentRouteName.startsWith(`${section}.`));
}
