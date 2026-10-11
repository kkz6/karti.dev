import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import type { ReactNode } from 'react';

type Props = {
    value: string;
    onValueChange: (value: string) => void;
    children: ReactNode;
    placeholder?: string;
    id?: string;
    'aria-label'?: string;
    required?: boolean;
    disabled?: boolean;
    allowEmpty?: boolean;
};

export function BillingSelect({
    value,
    onValueChange,
    children,
    placeholder = 'Choose an option',
    allowEmpty = false,
    id,
    'aria-label': label,
    required,
    disabled,
}: Props) {
    return (
        <Select
            value={value}
            onValueChange={(selected) => onValueChange(selected === '__billing_empty' ? '' : selected)}
            required={required}
            disabled={disabled}
        >
            <SelectTrigger id={id} aria-label={label} className="w-full">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {allowEmpty && <SelectItem value="__billing_empty">Clear selection</SelectItem>}
                {children}
            </SelectContent>
        </Select>
    );
}

export function BillingSelectItem({ value, children }: { value: string | number; children: ReactNode }) {
    return <SelectItem value={String(value)}>{children}</SelectItem>;
}
