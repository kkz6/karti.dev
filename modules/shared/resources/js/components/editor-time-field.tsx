import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { setEditorTime } from '@shared/lib/editor-time';
import { useId } from 'react';

const hours = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

export function EditorTimeField({ value, onChange, disabled }: { value: Date; onChange: (value: Date) => void; disabled?: boolean }) {
    const id = useId();
    const fields = [
        { part: 'hour', label: 'Hour', value: String(value.getHours() % 12 || 12).padStart(2, '0'), options: hours },
        { part: 'minute', label: 'Minute', value: String(value.getMinutes()).padStart(2, '0'), options: minutes },
        { part: 'period', label: 'AM / PM', value: value.getHours() >= 12 ? 'PM' : 'AM', options: ['AM', 'PM'] },
    ] as const;

    return (
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Time">
            {fields.map((field) => (
                <div className="min-w-0 space-y-1.5" key={field.part}>
                    <Label htmlFor={`${id}-${field.part}`} className="text-muted-foreground text-xs">
                        {field.label}
                    </Label>
                    <Select
                        value={field.value}
                        onValueChange={(selected) => onChange(setEditorTime(value, field.part, selected))}
                        disabled={disabled}
                    >
                        <SelectTrigger id={`${id}-${field.part}`} className="tabular-nums">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 min-w-0">
                            {field.options.map((option) => (
                                <SelectItem value={option} key={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ))}
        </div>
    );
}
