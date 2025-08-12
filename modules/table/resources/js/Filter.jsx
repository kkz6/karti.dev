import { useRef, useEffect } from 'react'
import { trans } from './translations.js'
import Datepicker from './Datepicker'
import TextInput from './TextInput'
import Popover from './Popover'
import Select from './Select'
import { getSymbolForClause } from './clauses'
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

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
                            <XMarkIcon className="size-4" />
                        </button>
                    </div>
                ),
                content: () => (
                    <div className="flex flex-col space-y-2 py-2">
                        {filter.clauses.length > 1 && (
                            <div className="flex items-center px-2">
                                <div className="me-2 w-5">
                                    <FunnelIcon className="size-5" />
                                </div>
                                <Select
                                    ref={clauseSelectRef}
                                    value={value.clause}
                                    onChange={setFilterClause}
                                    className="it-filter-clause-select-input w-full"
                                >
                                    {filter.clauses.map((clause) => (
                                        <option
                                            key={clause}
                                            value={clause}
                                        >
                                            {trans(`clause_${clause}`)}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        )}
                        {filter.type !== 'boolean' && value.clause !== 'is_set' && value.clause !== 'is_not_set' && (
                            <div className="flex items-center px-2">
                                <div className="me-2 w-5">
                                    <MagnifyingGlassIcon className="size-5" />
                                </div>
                                <div
                                    ref={inputRef}
                                    className="it-filter-input-container grow"
                                >
                                    {filter.type === 'numeric' && (value.clause === 'between' || value.clause === 'not_between') ? (
                                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                            <TextInput
                                                value={value.value?.[0] ?? ''}
                                                onChange={(newValue) => setFilterValue([newValue, value.value?.[1]])}
                                                type="number"
                                                className="w-28"
                                            />
                                            <span className="text-sm text-gray-500 dark:text-zinc-500">{trans('between_values_and')}</span>
                                            <TextInput
                                                value={value.value?.[1] ?? ''}
                                                onChange={(newValue) => setFilterValue([value.value?.[0], newValue])}
                                                type="number"
                                                className="w-28"
                                            />
                                        </div>
                                    ) : filter.type === 'text' || filter.type === 'numeric' ? (
                                        <TextInput
                                            value={value.value ?? ''}
                                            onChange={setFilterValue}
                                            type={filter.type === 'text' ? 'text' : 'number'}
                                            className="w-full"
                                        />
                                    ) : filter.type === 'set' ? (
                                        <Select
                                            value={value.value}
                                            onChange={setFilterValue}
                                            className="w-full"
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
                                        </Select>
                                    ) : filter.type === 'date' ? (
                                        <div className="relative">
                                            <TextInput
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
