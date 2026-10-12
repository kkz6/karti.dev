import { Alert, AlertDescription, AlertTitle } from '@shared/components/ui/alert';
import { CircleAlert, Info } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { toast } from 'sonner';

export function BillingFeedback({
    children,
    kind = 'info',
    title,
}: {
    children: ReactNode;
    kind?: 'error' | 'success' | 'info' | 'warning';
    title?: string;
}) {
    useEffect(() => {
        if (kind === 'success')
            toast.success(title ?? children, {
                description: title ? children : undefined,
                id: typeof children === 'string' ? `feedback:${children}` : undefined,
            });
    }, [children, kind, title]);
    if (kind === 'success') return null;
    const Icon = kind === 'error' || kind === 'warning' ? CircleAlert : Info;
    return (
        <Alert
            role="alert"
            variant={kind === 'error' ? 'destructive' : kind}
            className={kind === 'error' ? 'text-destructive border-destructive/25' : undefined}
        >
            <Icon aria-hidden="true" />
            {title && <AlertTitle>{title}</AlertTitle>}
            <AlertDescription style={kind === 'error' ? { color: 'var(--destructive)' } : undefined}>{children}</AlertDescription>
        </Alert>
    );
}
