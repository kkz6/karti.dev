import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@shared/lib/utils';
import { controlSurface } from './control';

const buttonVariants = cva(
    "ui-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[0.8125rem] font-medium transition-[color,box-shadow,transform,background-color] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                control: `${controlSurface} justify-start font-normal active:scale-100`,
                default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
                destructive:
                    'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
                // Quiet by default, committing red on hover — for destructive
                // actions sitting inline in lists, where a solid slab shouts
                destructiveGhost:
                    'ui-button-destructive-outline border border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive hover:border-destructive hover:text-white focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
                outline: 'ui-button-outline border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
                secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'ui-button-link text-primary underline-offset-4 hover:underline',
                info: 'bg-blue-500 text-white shadow-xs hover:bg-blue-500/90 focus-visible:ring-blue-500/20 dark:focus-visible:ring-blue-500/40',
                success:
                    'bg-emerald-500 text-white shadow-xs hover:bg-emerald-500/90 focus-visible:ring-emerald-500/20 dark:focus-visible:ring-emerald-500/40',
                warning:
                    'bg-amber-500 text-white shadow-xs hover:bg-amber-500/90 focus-visible:ring-amber-500/20 dark:focus-visible:ring-amber-500/40',
            },
            size: {
                control: 'h-9 px-3',
                default: 'h-8 px-3 has-[>svg]:px-2.5',
                sm: 'h-7 rounded-md px-2.5 has-[>svg]:px-2',
                lg: 'h-9 rounded-md px-5 has-[>svg]:px-4',
                icon: 'ui-button-icon size-8',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

function Button({
    className,
    variant,
    size,
    asChild = false,
    type,
    role,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot : 'button';

    const resolvedVariant = role === 'combobox' && (!variant || variant === 'outline') ? 'control' : variant;
    return (
        <Comp
            type={type ?? (asChild ? undefined : 'button')}
            role={role}
            data-slot="button"
            className={cn(buttonVariants({ variant: resolvedVariant, size: resolvedVariant === 'control' ? 'control' : size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
