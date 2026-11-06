import { Button } from '@shared/components/ui/button';
import { X } from 'lucide-react';
import { parseRecipients, validEmail } from '../lib/recipients';

export function EmailRecipients({
    value,
    draft,
    onDraft,
    onChange,
    disabled,
    suggestions = [],
}: {
    value: string;
    draft: string;
    onDraft: (value: string) => void;
    onChange: (value: string) => void;
    disabled: boolean;
    suggestions?: string[];
}) {
    const emails = parseRecipients(value);
    const add = (text: string) => {
        onChange(parseRecipients([...emails, text].join(',')).join(', '));
        onDraft('');
    };
    return (
        <div className="space-y-2">
            <div className="focus-within:ring-ring flex min-h-12 flex-wrap items-center gap-2 rounded-md border p-2 focus-within:ring-2">
                {emails.map((email) => (
                    <span
                        key={email.toLowerCase()}
                        className={`inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-sm ${validEmail(email) ? 'bg-muted' : 'border-destructive text-destructive'}`}
                    >
                        <span className="break-all">{email}</span>
                        <button
                            type="button"
                            aria-label={`Remove ${email}`}
                            disabled={disabled}
                            className="shrink-0 rounded p-1"
                            onClick={() => onChange(emails.filter((item) => item !== email).join(', '))}
                        >
                            <X className="size-3" />
                        </button>
                    </span>
                ))}
                <input
                    id="invoice-email-recipients"
                    aria-label="Add email address"
                    inputMode="email"
                    autoComplete="email"
                    value={draft}
                    disabled={disabled}
                    className="min-w-40 flex-1 bg-transparent px-1 py-1 text-sm outline-none"
                    placeholder="Add email address…"
                    onChange={(e) => onDraft(e.target.value)}
                    onBlur={() => {
                        if (draft.trim()) add(draft);
                    }}
                    onKeyDown={(e) => {
                        if (['Enter', ',', ';'].includes(e.key)) {
                            e.preventDefault();
                            if (draft.trim()) add(draft);
                        } else if (e.key === 'Backspace' && !draft) onChange(emails.slice(0, -1).join(', '));
                    }}
                    onPaste={(e) => {
                        const text = e.clipboardData.getData('text');
                        if (/[\s,;]/.test(text.trim())) {
                            e.preventDefault();
                            add([draft, text].join(' '));
                        }
                    }}
                />
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-xs">{emails.length}/10 recipients · Enter to add, or paste a list</span>
                {suggestions
                    .filter((email) => !emails.some((item) => item.toLowerCase() === email.toLowerCase()))
                    .map((email) => (
                        <Button key={email} type="button" size="sm" variant="outline" disabled={disabled} onClick={() => add(email)}>
                            Add {email}
                        </Button>
                    ))}
            </div>
        </div>
    );
}
