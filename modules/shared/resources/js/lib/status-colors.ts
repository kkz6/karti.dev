export type StatusTone = 'success' | 'warning' | 'info' | 'destructive' | 'muted';

export function statusTone(value: unknown): StatusTone {
    const state = String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, ' ');
    if (['active', 'paid', 'confirmed', 'completed', 'imported', 'published', 'settled', 'sent'].includes(state)) return 'success';
    if (
        ['partial', 'partially paid', 'pending', 'paused', 'unpaid', 'needs review', 'reviewed', 'staged', 'creating', 'reversed', 'queued'].includes(
            state,
        )
    )
        return 'warning';
    if (['issued', 'processing', 'business', 'individual', 'read', 'open'].includes(state)) return 'info';
    if (['cancelled', 'canceled', 'failed', 'error', 'overdue', 'expired', 'rejected'].includes(state)) return 'destructive';
    return 'muted';
}

export function badgeTone(value: unknown): StatusTone | 'default' | 'outline' | 'secondary' {
    if (value === 'danger') return 'destructive';
    return ['success', 'warning', 'info', 'destructive', 'default', 'outline', 'secondary', 'muted'].includes(String(value))
        ? (value as StatusTone | 'default' | 'outline' | 'secondary')
        : 'outline';
}
export const statusChipClasses: Record<StatusTone, string> = {
    success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    warning: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    info: 'border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    destructive: 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300',
    muted: 'border-border bg-card text-muted-foreground',
};
