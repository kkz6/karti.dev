import { Alert, AlertDescription, AlertTitle } from '@shared/components/ui/alert';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import type { ReactNode } from 'react';

export function BillingFeedback({
    children,
    kind = 'info',
    title,
}: {
    children: ReactNode;
    kind?: 'error' | 'success' | 'info' | 'warning';
    title?: string;
}) {
    const Icon = kind === 'success' ? CircleCheck : kind === 'error' || kind === 'warning' ? CircleAlert : Info;
    return (
        <Alert
            role={kind === 'success' ? 'status' : 'alert'}
            variant={kind === 'error' ? 'destructive' : kind}
            className={kind === 'error' ? 'text-destructive border-destructive/25' : undefined}
        >
            <Icon aria-hidden="true" />
            {title && <AlertTitle>{title}</AlertTitle>}
            <AlertDescription style={kind === 'error' ? { color: 'var(--destructive)' } : undefined}>{children}</AlertDescription>
        </Alert>
    );
}
