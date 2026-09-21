import { cn } from '@shared/lib/utils';
import { type ComponentPropsWithoutRef, type ElementType } from 'react';

type PageContainerProps<T extends ElementType> = {
    as?: T;
    className?: string;
    width?: 'standard' | 'full';
    padding?: 'default' | 'compact' | 'header' | 'none';
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>;

const widthClasses = {
    standard: 'max-w-[90rem]',
    full: 'max-w-none',
} as const;

const paddingClasses = {
    default: 'px-4 pt-5 pb-10 sm:px-6 sm:pt-6 sm:pb-12 lg:px-8 lg:pt-8 lg:pb-14 xl:px-10',
    compact: 'px-4 py-4 sm:px-6 lg:px-8 xl:px-10',
    header: 'px-4 sm:px-6 lg:px-8 xl:px-10',
    none: '',
} as const;

/**
 * The shared horizontal and vertical canvas for every admin page.
 * Use `width="full"` only for workspaces that intentionally need the entire panel.
 */
export function PageContainer<T extends ElementType = 'div'>({
    as,
    className,
    width = 'standard',
    padding = 'default',
    ...props
}: PageContainerProps<T>) {
    const Component = as ?? 'div';

    return <Component className={cn('admin-page-container mx-auto w-full', widthClasses[width], paddingClasses[padding], className)} {...props} />;
}
