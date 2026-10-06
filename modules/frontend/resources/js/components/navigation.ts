export const navigation = [
    { name: 'About', href: '/about' },
    { name: 'Articles', href: '/articles' },
    { name: 'Projects', href: '/projects' },
    { name: 'Speaking', href: '/speaking' },
    { name: 'Photography', href: '/photography' },
    { name: 'Uses', href: '/uses' },
    { name: 'Contact', href: '/contact' },
];

export function isNavigationActive(url: string, href: string) {
    const path = url.split(/[?#]/)[0];
    return path === href || path.startsWith(`${href}/`);
}
