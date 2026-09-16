import { cn } from '@shared/lib/utils';
import * as React from 'react';
import { controlSurface } from './control';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
    return <textarea data-slot="textarea" className={cn(controlSurface, 'flex w-full min-w-0', className)} ref={ref} {...props} />;
});
Textarea.displayName = 'Textarea';

export { Textarea };
