import { EditorDateField } from '@shared/components/editor-date-field';
import { formatDateOnly, parseDateOnly } from '@shared/lib/date-only';
import type { ComponentProps } from 'react';

/** Date-only shadcn field. Forwards FormControl labels, errors and focus refs to the trigger. */
export function DateField({
    value,
    onChange,
    label,
    disabled,
    ...triggerProps
}: Omit<ComponentProps<'button'>, 'value' | 'onChange' | 'children'> & {
    value?: string | null;
    onChange: (value: string) => void;
    label: string;
}) {
    return (
        <EditorDateField
            value={parseDateOnly(value)}
            onChange={(date) => onChange(formatDateOnly(date))}
            label={label}
            includeTime={false}
            disabled={disabled}
            triggerProps={triggerProps}
        />
    );
}
