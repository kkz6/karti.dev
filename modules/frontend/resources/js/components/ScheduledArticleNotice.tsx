import { Link } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { format } from 'date-fns';

export interface ArticlePreview {
    publishedAt: string;
    editHref: string;
}

export function ScheduledArticleNotice({ preview, compact = false }: { preview?: ArticlePreview | null; compact?: boolean }) {
    if (!preview) return null;

    const publishTime = format(new Date(preview.publishedAt), "d MMM yyyy 'at' h:mm a '(GMT'xxx')'");

    if (compact) {
        return (
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                <Badge variant="warning">Scheduled preview</Badge>
                <span className="text-muted-foreground">
                    Hidden from guests until <time dateTime={preview.publishedAt}>{publishTime}</time>
                </span>
            </div>
        );
    }

    return (
        <section className="mb-6 space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4" aria-label="Scheduled article preview">
            <Badge variant="warning">Scheduled preview</Badge>
            <p className="text-foreground text-sm leading-relaxed">
                You can read this article because you are signed in. Guests will see it from{' '}
                <time dateTime={preview.publishedAt} className="font-medium">
                    {publishTime}
                </time>
                .
            </p>
            <Link href={preview.editHref} className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">
                Edit article
            </Link>
        </section>
    );
}
