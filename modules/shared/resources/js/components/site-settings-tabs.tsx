import { Link } from '@inertiajs/react';
import { cn } from '@shared/lib/utils';

export function SiteSettingsTabs({ section }: { section: 'general' | 'media' | 'email' }) {
    const sections = [
        { id: 'general', label: 'General', href: route('admin.settings.edit') },
        { id: 'media', label: 'Media', href: route('admin.settings.media.edit') },
        { id: 'email', label: 'Email', href: route('admin.settings.email.edit') },
    ];
    return (
        <nav aria-label="Site settings sections" className="flex gap-1 overflow-x-auto border-b">
            {sections.map((item) => (
                <Link
                    key={item.id}
                    href={item.href}
                    aria-current={section === item.id ? 'page' : undefined}
                    className={cn(
                        'text-muted-foreground hover:text-foreground border-b-2 border-transparent px-4 py-3 text-sm font-medium whitespace-nowrap focus-visible:outline-2',
                        section === item.id && 'border-foreground text-foreground',
                    )}
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
