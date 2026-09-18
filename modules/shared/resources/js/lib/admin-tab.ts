/** Resolve only tabs belonging to this page; stale links must never hide every panel. */
export function readAdminTab(url: string, tabs: readonly string[], fallback: string, parameter = 'tab'): string {
    const value = new URL(url, 'https://admin.invalid').searchParams.get(parameter);
    return value && tabs.includes(value) ? value : fallback;
}

export function adminTabUrl(url: string, value: string, parameter = 'tab'): string {
    const next = new URL(url, 'https://admin.invalid');
    next.searchParams.set(parameter, value);
    return `${next.pathname}${next.search}${next.hash}`;
}
