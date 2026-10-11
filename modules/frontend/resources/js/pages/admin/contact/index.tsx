import { Head, Link } from '@inertiajs/react';
import { AdminPageContent } from '@shared/components/admin-page-content';
import { IndexHeader } from '@shared/components/index-header';
import { StatSummary } from '@shared/components/stat-summary';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { InertiaTableWrapper, type TableConfig } from '@table/components';
import { ExternalLink, Inbox, MailCheck, MailOpen, ShieldAlert, ShieldCheck } from 'lucide-react';

type ContactSubmission = {
    id: string;
    name: string;
    email: string;
    topic: string;
    subject: string;
    status: 'new' | 'read' | 'resolved';
    created_at: string;
};

type ContactInboxProps = {
    table: TableConfig<ContactSubmission>;
    counts: { new: number; open: number; resolved: number };
    protection: { turnstileEnabled: boolean; turnstileConfigured: boolean };
};

const metrics = [
    { key: 'new', label: 'New', icon: Inbox },
    { key: 'open', label: 'Open', icon: MailOpen },
    { key: 'resolved', label: 'Resolved', icon: MailCheck },
] as const;

export default function ContactInbox({ table, counts, protection }: ContactInboxProps) {
    const protectedByTurnstile = protection.turnstileEnabled && protection.turnstileConfigured;

    return (
        <AppLayout breadcrumbs={[{ title: 'Contact inbox', href: route('admin.contact.index') }]}>
            <Head title="Contact inbox" />
            <AdminPageContent>
                <IndexHeader
                    title="Contact inbox"
                    icon={Inbox}
                    actions={
                        <Button variant="outline" asChild>
                            <Link href={route('contact')}>
                                View contact form
                                <ExternalLink className="size-4" aria-hidden="true" />
                            </Link>
                        </Button>
                    }
                />

                <StatSummary items={metrics.map(({ key, label, icon }) => ({ label, icon, value: counts[key].toLocaleString() }))} />

                <div
                    className={
                        protectedByTurnstile
                            ? 'border-primary/20 bg-primary/6 flex items-start gap-3 rounded-lg border px-4 py-3'
                            : 'flex items-start gap-3 rounded-lg border border-amber-500/25 bg-amber-500/8 px-4 py-3'
                    }
                >
                    {protectedByTurnstile ? (
                        <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    ) : (
                        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    )}
                    <div className="min-w-0 text-sm">
                        <p className="font-medium">{protectedByTurnstile ? 'Cloudflare Turnstile is active' : 'Turnstile needs configuration'}</p>
                        <p className="text-muted-foreground mt-0.5 leading-relaxed">
                            {protectedByTurnstile
                                ? 'Every public message is verified on the server. Rate limits and the hidden spam trap remain active as additional protection.'
                                : 'The form still uses rate limits and a hidden spam trap. Add the Turnstile site and secret keys to enable server-verified bot protection.'}
                        </p>
                    </div>
                </div>

                <InertiaTableWrapper
                    resource={table}
                    emptyState={{
                        title: 'No contact messages yet',
                        description: 'Messages from the public contact form will appear here.',
                        icons: [Inbox],
                    }}
                />
            </AdminPageContent>
        </AppLayout>
    );
}
