import { trans } from './translations.js'
import Dropdown from './Dropdown'
import DropdownItem from './DropdownItem'
import DropdownSeparator from './DropdownSeparator'
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff, Lock, Unlock } from 'lucide-react';
import { clsx } from 'clsx'

const ButtonIcon = ({ sort, className = 'size-4 ms-2' }) => {
    if (!sort) {
        return <ChevronsUpDown className={className} />
    }

    return sort === 'asc' ? <ArrowUp className={className} /> : <ArrowDown className={className} />
}

export default function TableHeaderDropdown({ column, sort, sticky, onToggle, onSort, onStick, onUnstick }) {
    return (
        <Dropdown
            placement={column.alignment === 'right' ? 'bottom end' : 'bottom start'}
            className="it-table-column-dropdown"
        >
            {{
                trigger: ({ open }) => (
                    <div
                        className={clsx(
                            'inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md px-3 font-semibold transition-colors',
                            'hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1',
                            'dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500',
                            {
                                'bg-gray-100 dark:bg-zinc-800': open,
                                'bg-gray-50 ring-1 ring-gray-300 dark:bg-zinc-800 dark:ring-zinc-500': sort,
                            },
                        )}
                    >
                        {sticky && <Lock className="me-2 size-4" />}
                        <span className={column.headerClass}>{column.header}</span>
                        <ButtonIcon
                            sort={sort}
                            className="ms-2 size-4"
                        />
                    </div>
                ),
                content: () => (
                    <>
                        {column.sortable && (
                            <>
                                <DropdownItem
                                    title={trans('sort_asc')}
                                    onClick={() => onSort(column.attribute)}
                                    icon={<ArrowUp />}
                                />
                                <DropdownItem
                                    title={trans('sort_desc')}
                                    onClick={() => onSort(`-${column.attribute}`)}
                                    icon={<ArrowDown />}
                                />
                            </>
                        )}
                        {column.sortable && (column.toggleable || column.stickable) && <DropdownSeparator />}

                        {column.stickable && !sticky && (
                            <DropdownItem
                                title={trans('stick')}
                                onClick={() => onStick(column)}
                                icon={<Lock />}
                            />
                        )}

                        {column.stickable && sticky && (
                            <DropdownItem
                                title={trans('unstick')}
                                onClick={() => onUnstick(column)}
                                icon={<Unlock />}
                            />
                        )}

                        {column.toggleable && (
                            <DropdownItem
                                title={trans('hide_column')}
                                onClick={() => onToggle(column)}
                                icon={<EyeOff />}
                            />
                        )}
                    </>
                ),
            }}
        </Dropdown>
    )
}
