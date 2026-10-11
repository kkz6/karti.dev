import { cn } from '@shared/lib/utils';
import { Check, ChevronsUpDown, Globe } from 'lucide-react';
import { forwardRef, useState, type ComponentProps } from 'react';
import PhoneNumberInput, { getCountryCallingCode, isSupportedCountry, parsePhoneNumber, type Country } from 'react-phone-number-input';
import { Button } from './button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

type PhoneInputProps = Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type' | 'ref'> & {
    value: string;
    onChange: (value: string) => void;
    defaultCountry?: string | null;
};

/** Keeps the stored value untouched until the user edits the number. */
export function PhoneInput({ value, onChange, defaultCountry, className, ...props }: PhoneInputProps) {
    const code = defaultCountry?.toUpperCase();
    const country = code && isSupportedCountry(code) ? (code as Country) : undefined;
    const parsed = value ? parsePhoneNumber(value, country) : undefined;

    // Legacy free-text numbers and extensions must remain editable without losing information.
    if (value && ((!parsed && !value.startsWith('+')) || parsed?.ext)) {
        return (
            <Input {...props} type="tel" autoComplete="tel" className={className} value={value} onChange={(event) => onChange(event.target.value)} />
        );
    }

    return (
        <PhoneNumberInput
            {...props}
            className={cn('flex min-w-0 items-stretch', className)}
            defaultCountry={country}
            initialValueFormat="national"
            value={parsed?.number ?? (value || undefined)}
            onChange={(number) => onChange(number ?? '')}
            inputComponent={NumberInput}
            countrySelectComponent={CountrySelect}
            countrySelectProps={{ 'aria-invalid': props['aria-invalid'] }}
            autoComplete="tel"
            placeholder="Phone number"
        />
    );
}

const NumberInput = forwardRef<HTMLInputElement, ComponentProps<'input'>>(function NumberInput({ className, ...props }, ref) {
    return <Input {...props} ref={ref} className={cn('relative rounded-s-none focus-visible:z-10', className)} />;
});

function CountryFlag({ country }: { country?: Country }) {
    return country ? (
        <span aria-hidden="true" className="text-base leading-none">
            {String.fromCodePoint(...[...country].map((char) => 127397 + char.charCodeAt(0)))}
        </span>
    ) : (
        <Globe aria-hidden="true" className="size-4" />
    );
}

type CountrySelectProps = {
    value?: Country;
    onChange: (country?: Country) => void;
    options: { value?: Country; label: string; divider?: boolean }[];
    disabled?: boolean;
    readOnly?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
    'aria-invalid'?: ComponentProps<'input'>['aria-invalid'];
};

function CountrySelect({ value, onChange, options, disabled, readOnly, onFocus, onBlur, 'aria-invalid': invalid }: CountrySelectProps) {
    const [open, setOpen] = useState(false);
    const selected = options.find((option) => option.value === value);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="control"
                    className="relative h-auto shrink-0 gap-1.5 rounded-e-none border-e-0 px-2.5 focus-visible:z-10"
                    disabled={disabled || readOnly}
                    aria-label={`Phone country: ${selected?.label ?? 'International'}${value ? ` (+${getCountryCallingCode(value)})` : ''}`}
                    aria-invalid={invalid}
                    onFocus={onFocus}
                    onBlur={onBlur}
                >
                    <CountryFlag country={value} />
                    <span className="text-xs">{value ? `+${getCountryCallingCode(value)}` : 'Intl.'}</span>
                    <ChevronsUpDown aria-hidden="true" className="text-muted-foreground size-3" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 max-w-[calc(100vw-2rem)] p-0">
                <Command filter={(value, search) => (value.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0)}>
                    <CommandInput placeholder="Search country or code…" aria-label="Search phone countries" />
                    <CommandList className="max-h-60 overscroll-contain">
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                            {options
                                .filter((option) => !option.divider)
                                .map((option) => (
                                    <CommandItem
                                        key={option.value ?? 'international'}
                                        value={`${option.label} ${option.value ?? ''} ${option.value ? `+${getCountryCallingCode(option.value)}` : ''}`}
                                        onSelect={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                        }}
                                    >
                                        <CountryFlag country={option.value} />
                                        <span className="flex-1 truncate">{option.label}</span>
                                        {option.value && (
                                            <span className="text-muted-foreground text-xs tabular-nums">+{getCountryCallingCode(option.value)}</span>
                                        )}
                                        <Check aria-hidden="true" className={cn('size-3.5', value === option.value ? 'opacity-100' : 'opacity-0')} />
                                    </CommandItem>
                                ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
