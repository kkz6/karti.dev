import * as React from 'react';

import { cn } from '@shared/lib/utils';
import { controlSurface } from './control';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                controlSurface,
                'file:text-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none',
                className,
            )}
            {...props}
        />
    );
}

export { Input };
