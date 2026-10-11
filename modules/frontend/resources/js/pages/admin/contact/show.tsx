import { Head, router } from '@inertiajs/react';
import { PageContainer } from '@shared/components/page-container';
import { PageHeader } from '@shared/components/page-header';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { CheckCircle2, ExternalLink, Mail, MailOpen, RotateCcw } from 'lucide-react';
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
                <PageHeader
                    title={submission.subject}
                    description={
                        <>
                            From <span className="text-foreground font-medium">{submission.name}</span> ({submission.email})
                        </>
                    }
                    badges={<Badge variant={statusVariant[submission.status]}>{submission.status}</Badge>}
                    stickyMeta={formatDate(submission.createdAt)}
                    actions={
                        <>
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
                        </>
                    }
                    className="border-b pb-6"
                />

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
