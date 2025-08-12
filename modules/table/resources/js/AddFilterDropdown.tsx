import { Filter, Plus } from 'lucide-react';
import React from 'react';

import { Button } from '@shared/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { useLang } from '@shared/hooks/use-lang';
import type { AddFilterDropdownProps } from './types';

export default function AddFilterDropdown({ filters, state, onAdd }: AddFilterDropdownProps): React.ReactElement {
    const { t } = useLang();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="it-dropdown-button w-full justify-start">
                    <Filter className="me-2 size-4" />
                    <span>{t('table::table.filters_button')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="it-add-filter-dropdown it-dropdown-items w-max min-w-24">
                <DropdownMenuLabel className="it-dropdown-header">{t('table::table.add_filter_header')}</DropdownMenuLabel>
                <DropdownMenuSeparator className="it-dropdown-separator" />
                {filters.map((filter, key) => {
                    const filterState = state[filter.attribute];
                    const isEnabled = filterState?.enabled || false;

                    return (
                        <DropdownMenuItem key={key} disabled={isEnabled} onClick={() => onAdd(filter)} className="it-dropdown-item">
                            {!isEnabled && <Plus className="me-2 size-3.5" />}
                            <span>{filter.label}</span>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
