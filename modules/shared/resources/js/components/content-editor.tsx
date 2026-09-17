import { Link } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Switch } from '@shared/components/ui/switch';
import { Archive, ArrowLeft, ChevronDown, ExternalLink, MoreHorizontal, Trash2 } from 'lucide-react';
import { useId, useRef } from 'react';

export function ContentEditorHeader({
    title,
    status,
    formId,
    processing,
    backHref,
    onDelete,
    onArchive,
}: {
    title: string;
    status?: string;
    formId: string;
    processing?: boolean;
    backHref: string;
    onDelete?: () => void;
    onArchive?: () => void;
}) {
    const published = status === 'published' || status === 'active';
    const closeSubmitter = useRef<HTMLButtonElement>(null);
    const saveSubmitter = useRef<HTMLButtonElement>(null);
    const submit = (close: boolean) => {
        const button = close ? closeSubmitter.current : saveSubmitter.current;
        if (!processing && button?.form) button.form.requestSubmit(button);
    };

    return (
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
                {status && (
                    <span className={`size-2 shrink-0 rounded-full ${published ? 'bg-emerald-500' : 'bg-zinc-400'}`} role="img" aria-label={status} />
                )}
                <h1 data-editor-title className="min-w-0 text-2xl font-semibold tracking-tight break-words">{title}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" disabled={processing} aria-label="Entry actions">
                            <MoreHorizontal className="size-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={backHref}>
                                <ArrowLeft />
                                Back to list
                            </Link>
                        </DropdownMenuItem>
                        {onArchive && (
                            <DropdownMenuItem onSelect={onArchive}>
                                <Archive />
                                {status === 'archived' ? 'Restore as draft' : 'Mark as archived'}
                            </DropdownMenuItem>
                        )}
                        {onDelete && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
                                    <Trash2 />
                                    Delete entry
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="editor-save-group flex items-stretch" role="group" aria-label="Save entry">
                    <Button ref={saveSubmitter} type="submit" form={formId} value="save" disabled={processing} className="rounded-r-none">
                        {processing
                            ? 'Saving…'
                            : published
                              ? 'Save & publish'
                              : status === 'archived'
                                ? 'Save archived entry'
                                : status === 'draft'
                                  ? 'Save draft'
                                  : 'Save changes'}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                size="icon"
                                disabled={processing}
                                className="rounded-l-none border-l border-black/20"
                                aria-label="Save options"
                            >
                                <ChevronDown className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => submit(false)}>Save</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => submit(true)}>Save & close</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <button
                    ref={closeSubmitter}
                    type="submit"
                    form={formId}
                    value="save-and-close"
                    disabled={processing}
                    hidden
                    aria-hidden="true"
                    tabIndex={-1}
                />
            </div>
        </header>
    );
}

export function EditorViewLink({ href, published = true }: { href?: string; published?: boolean }) {
    if (!href) return null;

    return (
        <div className="space-y-2">
            <Button variant="outline" asChild className="w-full">
                <a href={href} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" />
                    Visit URL
                </a>
            </Button>
            {!published && <p className="text-muted-foreground text-xs">This entry is not published. It will appear on the site after publishing.</p>}
        </div>
    );
}

export function EditorPublishedControl<T extends string>({
    value,
    onChange,
    publishedValue,
    draftValue,
    disabled,
    error,
}: {
    value: T;
    onChange: (value: T) => void;
    publishedValue: T;
    draftValue: T;
    disabled?: boolean;
    error?: string;
}) {
    const id = useId();
    return (
        <div>
            <div className="editor-published-control bg-muted flex items-center justify-between gap-4 rounded-xl px-5 py-4">
                <label htmlFor={id} className="text-sm font-medium">
                    Published
                </label>
                <Switch
                    id={id}
                    checked={value === publishedValue}
                    onCheckedChange={(checked) => onChange(checked ? publishedValue : draftValue)}
                    disabled={disabled}
                    aria-describedby={`${id}-help`}
                    aria-invalid={!!error}
                />
            </div>
            <p id={`${id}-help`} className={value === 'archived' ? 'text-muted-foreground mt-2 text-xs' : 'sr-only'}>
                {value === 'archived' ? 'Archived. Turn on Published to restore this entry, then save.' : 'Visibility changes apply when you save.'}
            </p>
            {error && (
                <p className="text-destructive mt-2 text-sm" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

export function EditorErrorSummary({ errors }: { errors: unknown }) {
    const collect = (value: unknown): string[] => {
        if (typeof value === 'string') return [value];
        if (!value || typeof value !== 'object') return [];
        if ('message' in value && typeof value.message === 'string') return [value.message];
        return Object.entries(value).flatMap(([key, item]) => (key === 'ref' || key === 'type' ? [] : collect(item)));
    };
    const messages = [...new Set(collect(errors))];
    if (!messages.length) return null;

    return (
        <div role="alert" className="border-destructive bg-destructive/5 text-destructive mb-6 border-l-2 px-4 py-3 text-sm">
            <p className="font-medium">Please check these fields before saving.</p>
            <ul className="mt-1 list-inside list-disc">
                {messages.map((message) => (
                    <li key={message}>{message}</li>
                ))}
            </ul>
        </div>
    );
}
