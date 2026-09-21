import { Head, Link, router } from '@inertiajs/react';
import { PageContainer } from '@shared/components/page-container';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { ArrowLeft, CheckCircle2, ExternalLink, Mail, MailOpen, RotateCcw } from 'lucide-react';
import { useState } from 'react';

type Submission = {
    id: string;
    name: string;
    email: string;
    topic: string;
    subject: string;
    message: string;
    status: 'new' | 'read' | 'resolved';
    sourceUrl: string | null;
    userAgent: string | null;
    readAt: string | null;
    resolvedAt: string | null;
    notifiedAt: string | null;
    createdAt: string;
};

const statusVariant = {
    new: 'success',
    read: 'secondary',
    resolved: 'muted',
} as const;

function formatDate(value: string | null) {
    if (!value) return 'Not yet';
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function ContactSubmissionShow({ submission }: { submission: Submission }) {
    const [processing, setProcessing] = useState(false);

    function updateStatus(status: Submission['status']) {
        setProcessing(true);
        router.patch(route('admin.contact.update', submission.id), { status }, { preserveScroll: true, onFinish: () => setProcessing(false) });
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Contact inbox', href: route('admin.contact.index') },
                { title: submission.subject, href: route('admin.contact.show', submission.id) },
            ]}
        >
            <Head title={submission.subject} />
            <PageContainer className="space-y-7">
                <Link
                    href={route('admin.contact.index')}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-2 rounded-sm text-sm focus-visible:ring-2 focus-visible:outline-none"
                >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Contact inbox
                </Link>

                <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge variant={statusVariant[submission.status]}>{submission.status}</Badge>
                            <span className="text-muted-foreground text-sm">{formatDate(submission.createdAt)}</span>
                        </div>
                        <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-tight sm:text-3xl">{submission.subject}</h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            From <span className="text-foreground font-medium">{submission.name}</span> ({submission.email})
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <a href={`mailto:${submission.email}?subject=${encodeURIComponent(`Re: ${submission.subject}`)}`}>
                                <Mail className="size-4" aria-hidden="true" />
                                Reply
                            </a>
                        </Button>
                        {submission.status === 'new' ? (
                            <Button variant="outline" onClick={() => updateStatus('read')} disabled={processing}>
                                <MailOpen className="size-4" aria-hidden="true" />
                                Mark as read
                            </Button>
                        ) : null}
                        {submission.status === 'resolved' ? (
                            <Button variant="outline" onClick={() => updateStatus('read')} disabled={processing}>
                                <RotateCcw className="size-4" aria-hidden="true" />
                                Reopen
                            </Button>
                        ) : (
                            <Button onClick={() => updateStatus('resolved')} disabled={processing}>
                                <CheckCircle2 className="size-4" aria-hidden="true" />
                                Resolve
                            </Button>
                        )}
                    </div>
                </header>

                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
                    <article aria-label="Message" className="min-w-0">
                        <p className="text-foreground text-base leading-7 whitespace-pre-wrap">{submission.message}</p>
                    </article>

                    <aside className="border-border/70 rounded-xl border p-5">
                        <h2 className="font-semibold">Submission details</h2>
                        <dl className="mt-4 space-y-4 text-sm">
                            <div>
                                <dt className="text-muted-foreground text-xs">Topic</dt>
                                <dd className="mt-1 font-medium capitalize">{submission.topic.replace('-', ' ')}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground text-xs">Received</dt>
                                <dd className="mt-1 font-medium">{formatDate(submission.createdAt)}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground text-xs">Notification email</dt>
                                <dd className="mt-1 font-medium">
                                    {submission.notifiedAt ? `Sent ${formatDate(submission.notifiedAt)}` : 'Pending or not configured'}
                                </dd>
                            </div>
                            {submission.sourceUrl ? (
                                <div>
                                    <dt className="text-muted-foreground text-xs">Source page</dt>
                                    <dd className="mt-1 min-w-0">
                                        <a
                                            href={submission.sourceUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary inline-flex max-w-full items-center gap-1 font-medium hover:underline"
                                        >
                                            <span className="truncate">{new URL(submission.sourceUrl).pathname}</span>
                                            <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                                        </a>
                                    </dd>
                                </div>
                            ) : null}
                        </dl>

                        {submission.userAgent ? (
                            <details className="mt-5 border-t pt-4">
                                <summary className="text-muted-foreground cursor-pointer text-xs font-medium">Technical context</summary>
                                <p className="text-muted-foreground mt-2 text-xs leading-relaxed break-words">{submission.userAgent}</p>
                            </details>
                        ) : null}
                    </aside>
                </div>
            </PageContainer>
        </AppLayout>
    );
}
