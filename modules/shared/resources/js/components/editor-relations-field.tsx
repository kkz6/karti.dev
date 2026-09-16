import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Input } from '@shared/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { ChevronDown, X } from 'lucide-react';
import { useId, useState } from 'react';

export function EditorRelationsField({
    label,
    options,
    value,
    onChange,
    invalid,
    triggerId,
}: {
    label: string;
    options: { id: number; name: string }[];
    value: number[];
    onChange: (ids: number[]) => void;
    invalid?: boolean;
    triggerId?: string;
}) {
    const id = useId();
    const [query, setQuery] = useState('');
    const selected = value.map((key) => options.find((option) => option.id === key)).filter((option) => !!option);
    const visible = options.filter((option) => option.name.toLowerCase().includes(query.toLowerCase()));
    return (
        <div className="space-y-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id={triggerId}
                        type="button"
                        variant="control"
                        className="w-full justify-between"
                        aria-label={label}
                        aria-invalid={invalid}
                    >
                        <span className="text-muted-foreground truncate">
                            {value.length ? `${value.length} ${value.length === 1 ? 'item' : 'items'} selected` : `Select ${label.toLowerCase()}`}
                        </span>
                        <ChevronDown className="text-muted-foreground size-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={`Search ${label.toLowerCase()}`}
                        aria-label={`Search ${label.toLowerCase()}`}
                    />
                    <div className="mt-2 max-h-60 space-y-1 overflow-auto">
                        {visible.map((option) => (
                            <label
                                key={option.id}
                                htmlFor={`${id}-${option.id}`}
                                className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm"
                            >
                                <Checkbox
                                    id={`${id}-${option.id}`}
                                    checked={value.includes(option.id)}
                                    onCheckedChange={(checked) =>
                                        onChange(checked ? [...new Set([...value, option.id])] : value.filter((key) => key !== option.id))
                                    }
                                />
                                <span>{option.name}</span>
                            </label>
                        ))}
                        {!visible.length && (
                            <p className="text-muted-foreground p-2 text-sm">
                                {options.length ? 'No matching items.' : `No ${label.toLowerCase()} available.`}
                            </p>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
            {selected.map((option) => (
                <div key={option.id} className="border-input bg-card flex min-h-9 items-center gap-2 rounded-md border px-3 py-1 text-sm shadow-xs">
                    <span className="min-w-0 flex-1 truncate">{option.name}</span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground size-7 shrink-0"
                        aria-label={`Remove ${option.name}`}
                        onClick={() => onChange(value.filter((key) => key !== option.id))}
                    >
                        <X className="size-3.5" />
                    </Button>
                </div>
            ))}
        </div>
    );
}
