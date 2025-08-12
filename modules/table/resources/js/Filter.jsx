import { useRef, useEffect, useState } from 'react'
import { useLang } from '@shared/hooks/use-lang'
import { Input } from '@shared/components/ui/input'
import { Button } from '@shared/components/ui/button'
import { Calendar } from '@shared/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@shared/components/ui/popover'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@shared/components/ui/select'
import { cn } from '@shared/lib/utils'
import { getSymbolForClause } from './clauses'
import { Filter as FilterIcon, Search, X, CalendarIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const Filter = ({ filter, value, onChange, onRemove }) => {
    const { t } = useLang();
    const inputRef = useRef(null)
    const [isOpen, setIsOpen] = useState(false)
    const clauseSelectRef = useRef(null)

    function setFilterClause(newClause) {
        onChange({ ...value, clause: newClause })
    }

    function setFilterValue(newValue) {
        onChange({ ...value, value: newValue })
    }

    const formatDate = (value) => {
        if (Array.isArray(value)) {
            return value
                .map(formatDate)
                .filter((value) => !!value)
                .join(' - ')
        }

        return value ?? ''
    }

    const presentableValue = () => {
        if (filter.type === 'set') {
            const values = Array.isArray(value.value) ? value.value : [value.value]

            const labels = values.map((value) => filter.options.find((option) => option.value == value)?.label)

            return labels.length > 3 ? `${labels.slice(0, 3).join(', ')}, ...` : labels.join(', ')
        }

        if (filter.type === 'date') {
            return formatDate(value.value)
        }

        if (Array.isArray(value.value)) {
            return value.value.filter((value) => !!value).join(', ')
        }

        return value.value
    }

    const focusValueInput = () => {
        const focusOptions = { preventScroll: true }

        filter.type === 'boolean' ? clauseSelectRef.current?.focus(focusOptions) : inputRef.current?.querySelector('input,select')?.focus(focusOptions)
    }

    useEffect(() => {
        if (value.new) {
            setIsOpen(true)
        }
    }, [])

    useEffect(() => {
        if (!value.value) {
            focusValueInput()
        }
    }, [value])

    return (
        <Popover
            className="it-filter-popover"
            data-filter-attribute={filter.attribute}
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open)
                if (open) {
                    focusValueInput()
                }
            }}
        >
            <PopoverTrigger asChild>
                <div className="flex items-center rounded-md border border-gray-400 bg-gray-200/75 text-xs font-medium text-gray-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                    <button
                        type="button"
                        className="space-x-1 py-1 ps-2 text-sm font-medium rtl:space-x-reverse"
                    >
                        <span>{filter.label}</span>
                        {(value.value || filter.type === 'boolean' || value.clause === 'is_set' || value.clause === 'is_not_set') && (
                            <span className="font-mono">{getSymbolForClause(value.clause)}</span>
                        )}
                        {value.value && <span className="italic">{presentableValue()}</span>}
                    </button>
                    <button
                        type="button"
                        className="ms-2 h-full py-1 pe-2 text-gray-500 transition-colors hover:text-red-500"
                        onClick={onRemove}
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="it-popover-panel w-max min-w-24 p-1"
                align="start"
                sideOffset={8}
            >
                <div className="flex flex-col space-y-2 py-2">
                    {filter.clauses.length > 1 && (
                        <div className="flex items-center px-2">
                            <div className="me-2 w-5">
                                <FilterIcon className="size-5" />
                            </div>
                            <Select
                                value={value.clause}
                                onValueChange={(newClause) => setFilterClause(newClause)}
                            >
                                <SelectTrigger
                                    ref={clauseSelectRef}
                                    className="it-filter-clause-select-input w-full h-8"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {filter.clauses.map((clause) => (
                                        <SelectItem
                                            key={clause}
                                            value={clause}
                                        >
                                            {t(`table::table.clause_${clause}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {filter.type !== 'boolean' && value.clause !== 'is_set' && value.clause !== 'is_not_set' && (
                        <div className="flex items-center px-2">
                            <div className="me-2 w-5">
                                <Search className="size-5" />
                            </div>
                            <div
                                ref={inputRef}
                                className="it-filter-input-container grow"
                            >
                                {filter.type === 'numeric' && (value.clause === 'between' || value.clause === 'not_between') ? (
                                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                        <Input
                                            value={value.value?.[0] ?? ''}
                                            onChange={(e) => setFilterValue([e.target.value, value.value?.[1]])}
                                            type="number"
                                            className="w-28"
                                        />
                                        <span className="text-sm text-gray-500 dark:text-zinc-500">{t('table::table.between_values_and')}</span>
                                        <Input
                                            value={value.value?.[1] ?? ''}
                                            onChange={(e) => setFilterValue([value.value?.[0], e.target.value])}
                                            type="number"
                                            className="w-28"
                                        />
                                    </div>
                                ) : filter.type === 'text' || filter.type === 'numeric' ? (
                                    <Input
                                        value={value.value ?? ''}
                                        onChange={(e) => setFilterValue(e.target.value)}
                                        type={filter.type === 'text' ? 'text' : 'number'}
                                        className="w-full"
                                    />
                                ) : filter.type === 'set' ? (
                                    (value.clause === 'in' || value.clause === 'not_in' || filter.multiple) ? (
                                        // Multiple selection - keep native select for now as Shadcn doesn't have multi-select
                                        <select
                                            value={value.value}
                                            onChange={(e) => {
                                                const selectedValues = Array.from(e.target.selectedOptions, (option) => option.value)
                                                setFilterValue(selectedValues)
                                            }}
                                            className={cn(
                                                "w-full",
                                                "border-input bg-background text-foreground flex h-8 items-center justify-between rounded-md border px-3 py-1.5 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                            )}
                                            multiple
                                        >
                                            {filter.options.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        // Single selection - use Shadcn Select
                                        <Select
                                            value={value.value || ''}
                                            onValueChange={(newValue) => setFilterValue(newValue)}
                                        >
                                            <SelectTrigger className="w-full h-8">
                                                <SelectValue placeholder="Select an option..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filter.options.map((option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )
                                                                    ) : filter.type === 'date' ? (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !value.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {value.value ? (
                                                        (value.clause === 'between' || value.clause === 'not_between') && Array.isArray(value.value) ? (
                                                            value.value.length === 2 ?
                                                                `${format(parseISO(value.value[0]), 'PPP')} - ${format(parseISO(value.value[1]), 'PPP')}` :
                                                                'Pick dates'
                                                        ) : (
                                                            format(parseISO(value.value), 'PPP')
                                                        )
                                                    ) : (
                                                        'Pick a date'
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode={(value.clause === 'between' || value.clause === 'not_between') ? 'range' : 'single'}
                                                    selected={
                                                        value.value ? (
                                                            (value.clause === 'between' || value.clause === 'not_between') && Array.isArray(value.value) ?
                                                                value.value.length === 2 ? {
                                                                    from: parseISO(value.value[0]),
                                                                    to: parseISO(value.value[1])
                                                                } : undefined :
                                                                parseISO(value.value)
                                                        ) : undefined
                                                    }
                                                    onSelect={(date) => {
                                                        if (value.clause === 'between' || value.clause === 'not_between') {
                                                            if (date?.from && date?.to) {
                                                                setFilterValue([
                                                                    format(date.from, 'yyyy-MM-dd'),
                                                                    format(date.to, 'yyyy-MM-dd')
                                                                ])
                                                            }
                                                        } else if (date) {
                                                            setFilterValue(format(date, 'yyyy-MM-dd'))
                                                        }
                                                    }}
                                                    disabled={(date) =>
                                                        date > new Date() || date < new Date('1900-01-01')
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    ) : null}
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default Filter
