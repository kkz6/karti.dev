import { Head, Link } from '@inertiajs/react';
import { AdminPageContent } from '@shared/components/admin-page-content';
import { IndexHeader } from '@shared/components/index-header';
import { StatSummary } from '@shared/components/stat-summary';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { InertiaTableWrapper, type TableConfig } from '@table/components';
import { ExternalLink, Inbox, MailCheck, MailOpen } from 'lucide-react';

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
};

const metrics = [
    { key: 'new', label: 'New', icon: Inbox },
    { key: 'open', label: 'Open', icon: MailOpen },
    { key: 'resolved', label: 'Resolved', icon: MailCheck },
] as const;

export default function ContactInbox({ table, counts }: ContactInboxProps) {
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
