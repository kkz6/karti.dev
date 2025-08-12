import { Button } from '@shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { useLang } from '@shared/hooks/use-lang';
import { cn } from '@shared/lib/utils';
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff, Lock, Unlock } from 'lucide-react';
import React from 'react';
import type { ButtonIconProps, TableHeaderDropdownProps } from './types';

const ButtonIcon = ({ sort, className = 'size-4 ms-2' }: ButtonIconProps): React.ReactElement => {
    if (!sort) {
        return <ChevronsUpDown className={className} />;
    }

    return sort === 'asc' ? <ArrowUp className={className} /> : <ArrowDown className={className} />;
};

export default function TableHeaderDropdown({
    column,
    sort,
    sticky,
    onToggle,
    onSort,
    onStick,
    onUnstick,
}: TableHeaderDropdownProps): React.ReactElement {
    const { t } = useLang();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        'it-table-column-dropdown h-8 px-3 font-semibold',
                        'hover:bg-gray-100 dark:hover:bg-zinc-800',
                        'data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-zinc-800',
                        {
                            'bg-gray-50 ring-1 ring-gray-300 dark:bg-zinc-800 dark:ring-zinc-500': sort,
                        },
                    )}
                >
                    {sticky && <Lock className="me-2 size-4" />}
                    <span className={column.headerClass}>{column.header}</span>
                    <ButtonIcon sort={sort} className="ms-2 size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="it-dropdown-items w-max min-w-24" align={column.alignment === 'right' ? 'end' : 'start'}>
                {column.sortable && (
                    <>
                        <DropdownMenuItem onClick={() => onSort(column.attribute)} className="it-dropdown-item">
                            <ArrowUp className="me-2 size-3.5" />
                            <span>{t('table::table.sort_asc')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSort(`-${column.attribute}`)} className="it-dropdown-item">
                            <ArrowDown className="me-2 size-3.5" />
                            <span>{t('table::table.sort_desc')}</span>
                        </DropdownMenuItem>
                    </>
                )}
                {column.sortable && (column.toggleable || column.stickable) && <DropdownMenuSeparator className="it-dropdown-separator" />}

                {column.stickable && !sticky && (
                    <DropdownMenuItem onClick={() => onStick(column)} className="it-dropdown-item">
                        <Lock className="me-2 size-3.5" />
                        <span>{t('table::table.stick')}</span>
                    </DropdownMenuItem>
                )}

                {column.stickable && sticky && (
                    <DropdownMenuItem onClick={() => onUnstick(column)} className="it-dropdown-item">
                        <Unlock className="me-2 size-3.5" />
                        <span>{t('table::table.unstick')}</span>
                    </DropdownMenuItem>
                )}

                {column.toggleable && (
                    <DropdownMenuItem onClick={() => onToggle(column)} className="it-dropdown-item">
                        <EyeOff className="me-2 size-3.5" />
                        <span>{t('table::table.hide_column')}</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
