import { EditorTimeField } from '@shared/components/editor-time-field';
import { Button } from '@shared/components/ui/button';
import { Calendar } from '@shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { format, isValid } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { type ComponentProps, useId, useImperativeHandle, useRef, useState } from 'react';

export function EditorDateField({
    value,
    onChange,
    label = 'Publish date',
    includeTime = true,
    disabled,
    invalid,
    triggerId,
    triggerProps = {},
}: {
    value?: Date | null;
    onChange: (value: Date | undefined) => void;
    label?: string;
    includeTime?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    triggerId?: string;
    triggerProps?: Omit<ComponentProps<'button'>, 'children' | 'value' | 'onChange'>;
}) {
    const id = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    useImperativeHandle(triggerProps.ref, () => triggerRef.current!);
    const [open, setOpen] = useState(false);
    const [collisionBoundary, setCollisionBoundary] = useState<Element | null>(null);
    const date = value && isValid(value) ? value : undefined;
    const zone = `GMT${format(date ?? new Date(), 'xxx')}`;
    return (
        <div className="min-w-0 space-y-1.5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto]">
                <Popover
                    open={open}
                    onOpenChange={(open) => {
                        setOpen(open);
                        if (open) {
                            setCollisionBoundary(triggerRef.current?.closest('[role="dialog"], #main-content') ?? null);
                        }
                    }}
                >
                    <PopoverTrigger asChild>
                        <Button
                            {...triggerProps}
                            id={triggerId ?? triggerProps.id}
                            ref={triggerRef}
                            type="button"
                            variant="control"
                            className={`relative w-full min-w-0 gap-2 focus-visible:z-10 ${date ? 'rounded-r-none border-r-0' : ''}`}
                            disabled={disabled}
                            aria-label={label}
                            aria-invalid={invalid ?? triggerProps['aria-invalid']}
                            aria-describedby={
                                [triggerProps['aria-describedby'], includeTime ? `${id}-summary` : undefined].filter(Boolean).join(' ') || undefined
                            }
                        >
                            <CalendarIcon className="text-muted-foreground size-4" />
                            <span className={`min-w-0 flex-1 truncate text-left ${date ? '' : 'text-muted-foreground'}`}>
                                {date ? format(date, 'dd/MM/yyyy') : 'Select date'}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="max-h-[var(--radix-popover-content-available-height)] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain p-0"
                        align="start"
                        collisionBoundary={collisionBoundary}
                        collisionPadding={8}
                        sticky="always"
                        hideWhenDetached
                        aria-label={label}
                    >
                        <Calendar
                            className="w-full"
                            mode="single"
                            autoFocus
                            defaultMonth={date}
                            selected={date}
                            captionLayout={includeTime ? 'label' : 'dropdown'}
                            startMonth={includeTime ? undefined : new Date(1900, 0)}
                            endMonth={includeTime ? undefined : new Date(2100, 11)}
                            required
                            disabled={disabled}
                            onSelect={(next) => {
                                if (next && date && includeTime) next.setHours(date.getHours(), date.getMinutes(), 0, 0);
                                onChange(next);
                                if (!includeTime) setOpen(false);
                            }}
                        />
                        {includeTime && date && (
                            <div className="space-y-2 border-t p-3">
                                <div className="flex items-center justify-between gap-2 text-sm">
                                    <span className="font-medium">Time</span>
                                    <span className="text-muted-foreground text-xs">{zone}</span>
                                </div>
                                <EditorTimeField value={date} onChange={onChange} disabled={disabled} />
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
                {date && (
                    <Button
                        type="button"
                        variant="control"
                        className="text-muted-foreground relative w-9 shrink-0 justify-center rounded-l-none p-0 focus-visible:z-10"
                        disabled={disabled}
                        aria-label={`Clear ${label.toLowerCase()}`}
                        onClick={() => {
                            onChange(undefined);
                            triggerRef.current?.focus();
                        }}
                    >
                        <X className="size-3.5" />
                    </Button>
                )}
            </div>
            {includeTime && (
                <div
                    id={`${id}-summary`}
                    className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs tabular-nums"
                >
                    <span>{date ? format(date, 'hh:mm a') : 'Local time'}</span>
                    <span title="Your local time zone">{zone}</span>
                </div>
            )}
        </div>
    );
}
