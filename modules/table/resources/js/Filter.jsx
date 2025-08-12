import { useRef, useEffect } from 'react'
import { trans } from './translations.js'
import Datepicker from './Datepicker'
import { Input } from '@shared/components/ui/input'
import Popover from './Popover'
import { cn } from '@shared/lib/utils'
import { getSymbolForClause } from './clauses'
import { Filter as FilterIcon, Search, X } from 'lucide-react';

const Filter = ({ filter, value, onChange, onRemove }) => {
    const inputRef = useRef(null)
    const popoverRef = useRef(null)
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
            popoverRef.current?.clickTrigger()
        }
    }, [])

    useEffect(() => {
        if (!value.value) {
            focusValueInput()
        }
    }, [value])

    return (
        <Popover
            ref={popoverRef}
            className="it-filter-popover"
            data-filter-attribute={filter.attribute}
            onOpened={focusValueInput}
        >
            {{
                trigger: () => (
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
                ),
                content: () => (
                    <div className="flex flex-col space-y-2 py-2">
                        {filter.clauses.length > 1 && (
                            <div className="flex items-center px-2">
                                <div className="me-2 w-5">
                                    <FilterIcon className="size-5" />
                                </div>
                                <select
                                    ref={clauseSelectRef}
                                    value={value.clause}
                                    onChange={(e) => setFilterClause(e.target.value)}
                                    className={cn(
                                        "it-filter-clause-select-input w-full",
                                        "border-input bg-background text-foreground flex h-9 items-center justify-between rounded-md border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                    )}
                                >
                                    {filter.clauses.map((clause) => (
                                        <option
                                            key={clause}
                                            value={clause}
                                        >
                                            {trans(`clause_${clause}`)}
                                        </option>
                                    ))}
                                </select>
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
                                            <span className="text-sm text-gray-500 dark:text-zinc-500">{trans('between_values_and')}</span>
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
                                        <select
                                            value={value.value}
                                            onChange={(e) => {
                                                if (value.clause === 'in' || value.clause === 'not_in' || filter.multiple) {
                                                    const selectedValues = Array.from(e.target.selectedOptions, (option) => option.value)
                                                    setFilterValue(selectedValues)
                                                } else {
                                                    setFilterValue(e.target.value)
                                                }
                                            }}
                                            className={cn(
                                                "w-full",
                                                "border-input bg-background text-foreground flex h-9 items-center justify-between rounded-md border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                                            )}
                                            multiple={value.clause === 'in' || value.clause === 'not_in' || filter.multiple}
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
                                    ) : filter.type === 'date' ? (
                                        <div className="relative">
                                            <Input
                                                value={presentableValue() ?? ''}
                                                readOnly={true}
                                                className="w-full"
                                            />
                                            <Datepicker
                                                className="absolute left-0 top-12 z-10 rounded-md shadow-lg ring-1 ring-black/5 dark:bg-zinc-900 dark:shadow-zinc-800/50 dark:ring-zinc-700"
                                                range={value.clause === 'between' || value.clause === 'not_between'}
                                                value={value.value}
                                                onChange={(newValue) => setFilterValue(newValue)}
                                            />
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )}
                    </div>
                ),
            }}
        </Popover>
    )
}

export default Filter
