import { PageContainer } from '@shared/components/page-container';
import { cn } from '@shared/lib/utils';
import type { ComponentProps } from 'react';
/** Billing follows the same page width and gutters as the platform. */
export function BillingPageContainer({ className, ...props }: ComponentProps<typeof PageContainer>) {
    return <PageContainer {...props} width="standard" padding="default" className={cn('billing-workspace min-w-0', className)} />;
}
