import { useLang } from '@shared/hooks/use-lang';
import { cn } from '@shared/lib/utils';
import { Loader2 } from 'lucide-react';
import React from 'react';
import type { LoadingSpinnerProps } from './types';

export default function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps = {}): React.ReactElement {
    const { t } = useLang();

    const sizeClasses = {
        sm: 'size-6',
        md: 'size-10',
        lg: 'size-16',
    };

    return (
        <div role="status" className={cn('it-loading-spinner absolute inset-0 flex items-center justify-center', className)}>
            <Loader2 className={cn('animate-spin text-blue-600 dark:text-blue-400', sizeClasses[size])} aria-hidden="true" />
            <span className="sr-only">{t('table::table.loading_placeholder')}</span>
        </div>
    );
}
