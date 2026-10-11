import { Button } from '@shared/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@shared/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { cn } from '@shared/lib/utils';
import { ArrowDown, ArrowUp, ChevronDown, Copy, MoreHorizontal, Trash2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { InvoiceLine } from '../invoice-types';
import type { TaxRate } from '../types';
import { BillingSelect, BillingSelectItem } from './billing-select';
const itemColumns = 'lg:grid-cols-[60px_minmax(180px,1fr)_96px_112px_80px_100px_36px]';

export function InvoiceItemsHeader() {
    return (
        <div
            role="row"
            className={cn('text-muted-foreground hidden items-center gap-3 border-b px-3 py-2.5 text-xs font-medium lg:grid', itemColumns)}
        >
            {['Item', 'Description *', 'Quantity *', 'Unit price *', 'Unit *', 'Amount', 'Actions'].map((label) => (
                <div key={label} role="columnheader" className={label === 'Amount' ? 'text-right' : undefined}>
                    <span className={label === 'Actions' ? 'sr-only' : undefined}>{label}</span>
                </div>
            ))}
        </div>
    );
}

export function InvoiceItemEditor({
    line,
    index,
    handle,
    total,
    taxRates,
    readOnly,
    canRemove,
    canDuplicate,
    canMoveUp,
    canMoveDown,
    onChange,
    onRemove,
    onDuplicate,
    onMove,
    errors,
}: {
    line: InvoiceLine;
    index: number;
    handle: ReactNode;
    total?: string;
    taxRates: TaxRate[];
    readOnly: boolean;
    canRemove: boolean;
    canDuplicate: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onChange: (patch: Partial<InvoiceLine>) => void;
    onRemove: () => void;
    onDuplicate: () => void;
    onMove: (direction: number) => void;
    errors: Record<string, string>;
}) {
    const [expanded, setExpanded] = useState(readOnly && (!!line.additional_description || line.taxes.length > 0));
    const error = (field: string) => errors[`items.${index}.${field}`];
    return (
        <Collapsible open={expanded} onOpenChange={setExpanded} className="space-y-2">
            <div role="row" className={cn('grid grid-cols-2 items-start gap-3', itemColumns)}>
                <div role="cell" className="col-span-2 flex h-9 items-center justify-between lg:col-span-1">
                    <div className="flex items-center gap-1">
                        {handle}
                        <h3 className="text-xs font-medium whitespace-nowrap">
                            <span className="lg:sr-only">Item </span>
                            {index + 1}
                        </h3>
                    </div>
                    <div className="lg:hidden">
                        <ItemActions
                            index={index}
                            disabled={readOnly}
                            {...{ canRemove, canDuplicate, canMoveUp, canMoveDown, onRemove, onDuplicate, onMove }}
                        />
                    </div>
                </div>
                <div role="cell" className="col-span-2 space-y-1 lg:col-span-1 lg:space-y-0">
                    <Label htmlFor={`description-${line.key}`} className="text-muted-foreground text-xs lg:sr-only">
                        Description *
                    </Label>
                    <Input
                        id={`description-${line.key}`}
                        placeholder="Item or service description"
                        value={line.description}
                        onChange={(event) => onChange({ description: event.target.value })}
                        aria-invalid={!!error('description')}
                    />
                    {error('description') && (
                        <p role="alert" className="text-destructive text-xs">
                            {error('description')}
                        </p>
                    )}
                </div>
                {(['quantity', 'rate', 'unit'] as const).map((field) => (
                    <div key={field} role="cell" className="space-y-1 lg:space-y-0">
                        <Label htmlFor={`${field}-${line.key}`} className="text-muted-foreground text-xs lg:sr-only">
                            {field === 'rate' ? 'Unit price *' : field === 'quantity' ? 'Quantity *' : 'Unit *'}
                        </Label>
                        <Input
                            id={`${field}-${line.key}`}
                            type={field === 'unit' ? 'text' : 'number'}
                            min={field === 'quantity' ? '0.0001' : field === 'rate' ? '0' : undefined}
                            step={field === 'unit' ? undefined : '0.0001'}
                            value={line[field]}
                            onChange={(event) => onChange({ [field]: event.target.value })}
                            className={field === 'unit' ? undefined : 'tabular-nums'}
                            aria-invalid={!!error(field)}
                        />
                        {error(field) && (
                            <p role="alert" className="text-destructive text-xs">
                                {error(field)}
                            </p>
                        )}
                    </div>
                ))}
                <div role="cell" className="space-y-1 text-right lg:space-y-0">
                    <span className="text-muted-foreground text-xs lg:sr-only">Amount</span>
                    <p
                        aria-live="polite"
                        aria-label={`Amount for item ${index + 1}`}
                        className="flex h-9 items-center justify-end text-sm font-medium tabular-nums"
                    >
                        {total ?? '—'}
                    </p>
                </div>
                <div role="cell" className="hidden lg:block">
                    <ItemActions
                        index={index}
                        disabled={readOnly}
                        {...{ canRemove, canDuplicate, canMoveUp, canMoveDown, onRemove, onDuplicate, onMove }}
                    />
                </div>
            </div>
            <div role="row">
                <div role="cell" aria-colspan={7} className="lg:pl-[72px]">
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="link"
                            size="sm"
                            className="text-muted-foreground h-auto p-0 text-xs"
                            aria-label={`Details and taxes for item ${index + 1}`}
                        >
                            Details & taxes{line.taxes.length > 0 ? ` (${line.taxes.length})` : ''}
                            <ChevronDown className="size-3" />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-4 border-t pt-3">
                        <div className="space-y-2">
                            <Label htmlFor={`additional-${line.key}`}>Additional description</Label>
                            <Textarea
                                id={`additional-${line.key}`}
                                rows={2}
                                value={line.additional_description}
                                onChange={(event) => onChange({ additional_description: event.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            {line.taxes.map((tax, taxIndex) => (
                                <div key={taxIndex} className="bg-muted/40 flex flex-wrap items-center gap-2 rounded-md p-2">
                                    {tax.tax_rate_id === null ? (
                                        <>
                                            <Input
                                                aria-label={`Tax name for line ${index + 1}`}
                                                placeholder="Tax name"
                                                value={tax.name}
                                                className="min-w-0 flex-1"
                                                onChange={(event) =>
                                                    onChange({
                                                        taxes: line.taxes.map((entry, i) =>
                                                            i === taxIndex ? { ...entry, name: event.target.value } : entry,
                                                        ),
                                                    })
                                                }
                                            />
                                            <Input
                                                aria-label={`Tax percentage for line ${index + 1}`}
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.0001"
                                                value={tax.percentage}
                                                className="w-24"
                                                onChange={(event) =>
                                                    onChange({
                                                        taxes: line.taxes.map((entry, i) =>
                                                            i === taxIndex ? { ...entry, percentage: event.target.value } : entry,
                                                        ),
                                                    })
                                                }
                                            />
                                        </>
                                    ) : (
                                        <span className="flex-1 text-sm">
                                            {tax.name} · {tax.percentage}%
                                        </span>
                                    )}
                                    {!readOnly && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Remove tax ${taxIndex + 1} from line ${index + 1}`}
                                            onClick={() => onChange({ taxes: line.taxes.filter((_, i) => i !== taxIndex) })}
                                        >
                                            <X />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {!readOnly && (
                                <div className="flex flex-wrap gap-2">
                                    <div className="w-48">
                                        <BillingSelect
                                            value=""
                                            placeholder="Add tax preset"
                                            aria-label="Add tax preset"
                                            disabled={line.taxes.length >= 10}
                                            onValueChange={(value) => {
                                                const tax = taxRates.find((t) => String(t.id) === value);
                                                if (tax)
                                                    onChange({
                                                        taxes: [...line.taxes, { tax_rate_id: tax.id, name: tax.name, percentage: tax.percentage }],
                                                    });
                                            }}
                                        >
                                            {taxRates
                                                .filter((t) => !line.taxes.some((existing) => existing.tax_rate_id === t.id))
                                                .map((tax) => (
                                                    <BillingSelectItem key={tax.id} value={tax.id}>
                                                        {tax.name} · {tax.percentage}%
                                                    </BillingSelectItem>
                                                ))}
                                        </BillingSelect>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="control"
                                        className="ui-control"
                                        type="button"
                                        disabled={line.taxes.length >= 10}
                                        onClick={() => onChange({ taxes: [...line.taxes, { tax_rate_id: null, name: '', percentage: '0' }] })}
                                    >
                                        Add custom tax
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CollapsibleContent>
                </div>
            </div>
        </Collapsible>
    );
}
function ItemActions({
    index,
    disabled,
    canRemove,
    canDuplicate,
    canMoveUp,
    canMoveDown,
    onRemove,
    onDuplicate,
    onMove,
}: {
    index: number;
    disabled: boolean;
    canRemove: boolean;
    canDuplicate: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onRemove: () => void;
    onDuplicate: () => void;
    onMove: (direction: number) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={disabled} aria-label={`Item ${index + 1} actions`}>
                    <MoreHorizontal />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem disabled={!canDuplicate} onClick={onDuplicate}>
                    <Copy />
                    Duplicate item
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!canMoveUp} onClick={() => onMove(-1)}>
                    <ArrowUp />
                    Move up
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!canMoveDown} onClick={() => onMove(1)}>
                    <ArrowDown />
                    Move down
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={!canRemove} onClick={onRemove} className="text-destructive focus:text-destructive">
                    <Trash2 />
                    Remove item
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
