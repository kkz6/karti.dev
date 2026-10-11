import { Button } from '@shared/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@shared/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import type { CustomerChoice } from '../invoice-types';
export function CustomerPicker({
    id,
    value,
    choices,
    search,
    onSearch,
    onValueChange,
    disabled,
    placeholder = 'Choose customer',
    required,
}: {
    id: string;
    value: string;
    choices: CustomerChoice[];
    search: string;
    onSearch: (value: string) => void;
    onValueChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    required?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const selected = choices.find((customer) => String(customer.id) === value);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="control"
                    role="combobox"
                    aria-expanded={open}
                    aria-required={required}
                    disabled={disabled}
                    className="w-full min-w-0 justify-between"
                >
                    <span className="truncate">{selected?.display_name ?? placeholder}</span>
                    <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command shouldFilter={false}>
                    <CommandInput aria-label="Find customer" placeholder="Search customer names" value={search} onValueChange={onSearch} />
                    <CommandList>
                        <CommandEmpty>
                            {search.trim() ? 'No customers match this search.' : 'No active customers yet. Add or restore a customer first.'}
                        </CommandEmpty>
                        {choices.map((customer) => (
                            <CommandItem
                                key={customer.id}
                                value={String(customer.id)}
                                onSelect={() => {
                                    onValueChange(String(customer.id));
                                    setOpen(false);
                                }}
                            >
                                <Check className={String(customer.id) === value ? 'size-4' : 'size-4 opacity-0'} />
                                <span>
                                    {customer.display_name}
                                    {customer.archived_at ? ' · archived' : ''}
                                </span>
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
