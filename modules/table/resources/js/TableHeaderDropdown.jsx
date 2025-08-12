import { trans } from './translations.js'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@shared/components/ui/dropdown-menu'
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={clsx(
                        'it-table-column-dropdown inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md px-3 font-semibold transition-colors',
                        'hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1',
                        'dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500',
                        'data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-zinc-800',
                        {
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
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="it-dropdown-items w-max min-w-24"
                align={column.alignment === 'right' ? 'end' : 'start'}
            >
                {column.sortable && (
                    <>
                        <DropdownMenuItem
                            onClick={() => onSort(column.attribute)}
                            className="it-dropdown-item"
                        >
                            <ArrowUp className="me-2 size-3.5" />
                            <span>{trans('sort_asc')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onSort(`-${column.attribute}`)}
                            className="it-dropdown-item"
                        >
                            <ArrowDown className="me-2 size-3.5" />
                            <span>{trans('sort_desc')}</span>
                        </DropdownMenuItem>
                    </>
                )}
                {column.sortable && (column.toggleable || column.stickable) && <DropdownMenuSeparator className="it-dropdown-separator" />}

                {column.stickable && !sticky && (
                    <DropdownMenuItem
                        onClick={() => onStick(column)}
                        className="it-dropdown-item"
                    >
                        <Lock className="me-2 size-3.5" />
                        <span>{trans('stick')}</span>
                    </DropdownMenuItem>
                )}

                {column.stickable && sticky && (
                    <DropdownMenuItem
                        onClick={() => onUnstick(column)}
                        className="it-dropdown-item"
                    >
                        <Unlock className="me-2 size-3.5" />
                        <span>{trans('unstick')}</span>
                    </DropdownMenuItem>
                )}

                {column.toggleable && (
                    <DropdownMenuItem
                        onClick={() => onToggle(column)}
                        className="it-dropdown-item"
                    >
                        <EyeOff className="me-2 size-3.5" />
                        <span>{trans('hide_column')}</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
