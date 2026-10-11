/** Match index links to their section, but keep individual SEO reports distinct. */
export function isRouteActive(currentRouteName: string | null | undefined, itemHref: string): boolean {
    if (!currentRouteName) return false;

    const path = new URL(itemHref, 'https://navigation.invalid').pathname.replace(/\/+$/, '');

    if (path === '/admin/seo') return ['admin.seo.index', 'admin.seo.page', 'admin.seo.content'].includes(currentRouteName);
    if (path === '/admin/seo/google') return currentRouteName === 'admin.seo.google';
    if (path === '/dashboard') return currentRouteName === 'dashboard';
    if (path === '/admin/media-manager') return currentRouteName === 'media-manager';
    if (path === '/admin/settings') return ['admin.settings.edit', 'admin.settings.update'].includes(currentRouteName);
    if (path === '/admin/settings/media') return currentRouteName.startsWith('admin.settings.media.');
    if (path === '/admin/settings/email') return currentRouteName.startsWith('admin.settings.email.');

    if (path === '/admin/settings/billing')
        return (
            currentRouteName.startsWith('admin.settings.billing.') ||
            currentRouteName.startsWith('admin.billing.automation.') ||
            currentRouteName.startsWith('admin.billing.online.') ||
            currentRouteName.startsWith('admin.billing.imports.') ||
            currentRouteName.startsWith('admin.tax-rates.')
        );

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
