import { LucideIcon } from 'lucide-react';
import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';

interface EmptyStateProps {
    title: string;
    description?: string;
    icons?: LucideIcon[];
    action?: {
        label: string;
        onClick: () => void;
        disabled?: boolean;
    };
    className?: string;
}

export function EmptyState({ title, description, icons = [], action, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                'bg-background border-border hover:border-border/80 text-center',
                'w-full max-w-[620px] rounded-xl border-2 border-dashed p-14',
                'group hover:bg-muted/50 transition duration-500 hover:duration-200',
                className,
            )}
        >
            <div className="isolate flex justify-center">
                {icons.length === 3 ? (
                    <>
                        <div className="bg-background ring-border relative top-1.5 left-2.5 grid size-12 -rotate-6 place-items-center rounded-xl shadow-lg transition duration-500 group-hover:-translate-x-5 group-hover:-translate-y-0.5 group-hover:-rotate-12 group-hover:duration-200">
                            {React.createElement(icons[0], {
                                className: 'w-6 h-6 text-muted-foreground',
                            })}
                        </div>
                        <div className="bg-background ring-border relative z-10 grid size-12 place-items-center rounded-xl shadow-lg transition duration-500 group-hover:-translate-y-0.5 group-hover:duration-200">
                            {React.createElement(icons[1], {
                                className: 'w-6 h-6 text-muted-foreground',
                            })}
                        </div>
                        <div className="bg-background ring-border relative top-1.5 right-2.5 grid size-12 rotate-6 place-items-center rounded-xl shadow-lg transition duration-500 group-hover:translate-x-5 group-hover:-translate-y-0.5 group-hover:rotate-12 group-hover:duration-200">
                            {React.createElement(icons[2], {
                                className: 'w-6 h-6 text-muted-foreground',
                            })}
                        </div>
                    </>
                ) : (
                    <div className="bg-background ring-border grid size-12 place-items-center rounded-xl shadow-lg transition duration-500 group-hover:-translate-y-0.5 group-hover:duration-200">
                        {icons[0] &&
                            React.createElement(icons[0], {
                                className: 'w-6 h-6 text-muted-foreground',
                            })}
                    </div>
                )}
            </div>
            <h2 className="text-foreground mt-6 font-medium">{title}</h2>
            {description && <p className="text-muted-foreground mt-1 text-sm whitespace-pre-line">{description}</p>}
            {action && (
                <div className="mt-6 flex justify-center">
                    <Button onClick={action.onClick} disabled={action.disabled} variant="outline" className={cn('shadow-sm active:shadow-none')}>
                        {action.label}
                    </Button>
                </div>
            )}
        </div>
    );
}
