import { usePage } from '@inertiajs/react';
import { cn } from '@shared/lib/utils';
import type { SharedData } from '@shared/types';
import type { ComponentProps } from 'react';

/** Use the same saved favicon as the document head for all site-brand icons. */
export default function AppLogoIcon({ className, alt = '', ...props }: Omit<ComponentProps<'img'>, 'src'>) {
    const { site } = usePage<SharedData>().props;
    return (
        <img
            {...props}
            src={site?.favicon || '/favicon.ico'}
            alt={alt}
            width={32}
            height={32}
            className={cn('shrink-0 rounded-sm object-contain', className)}
        />
    );
}
