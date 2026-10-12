import { Link } from '@inertiajs/react';
import { cn } from '@shared/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { FormEventHandler, ReactNode } from 'react';
import { IndexHeader } from './index-header';
import { PageContainer } from './page-container';

export type SettingsSection = { id: string; title: string; href: string };

export function SettingsNavigation({ sections, selected, label }: { sections: SettingsSection[]; selected: string; label: string }) {
    return (
        <nav aria-label={label} className="flex min-w-0 gap-1 overflow-x-auto border-b">
            {sections.map((item) => (
                <Link
                    key={item.id}
                    href={item.href}
                    aria-current={selected === item.id ? 'page' : undefined}
                    className={cn(
                        'text-muted-foreground hover:text-foreground border-b-2 border-transparent px-4 py-3 text-sm font-medium whitespace-nowrap focus-visible:outline-2',
                        selected === item.id && 'border-foreground text-foreground',
                    )}
                >
                    {item.title}
                </Link>
            ))}
        </nav>
    );
}

/** One width, header and navigation contract for all admin settings. */
export function SettingsWorkspace({
    title,
    icon,
    actions,
    sections,
    selected,
    children,
    formId,
    onSubmit,
}: {
    title: string;
    icon?: LucideIcon;
    actions?: ReactNode;
    sections: SettingsSection[];
    selected: string;
    children: ReactNode;
    formId?: string;
    onSubmit?: FormEventHandler<HTMLFormElement>;
}) {
    return (
        <PageContainer as={formId ? 'form' : 'div'} id={formId} onSubmit={onSubmit} className="content-index settings-workspace space-y-6">
            <IndexHeader title={title} icon={icon} actions={actions} />
            <SettingsNavigation sections={sections} selected={selected} label={`${title} sections`} />
            <section className="settings-content min-w-0 space-y-6">{children}</section>
        </PageContainer>
    );
}
