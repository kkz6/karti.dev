import { cn } from '@shared/lib/utils';
import type { PropsWithChildren } from 'react';
import { PageContainer } from './page-container';

/** Shared canvas and rhythm for admin lists. Keep page-specific spacing inside sections. */
export function AdminPageContent({ children, className }: PropsWithChildren<{ className?: string }>) {
    return <PageContainer className={cn('content-index flex min-w-0 flex-col gap-6', className)}>{children}</PageContainer>;
}
