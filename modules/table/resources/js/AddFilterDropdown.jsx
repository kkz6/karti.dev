import { trans } from './translations.js'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@shared/components/ui/dropdown-menu'
import { Button } from '@shared/components/ui/button'
import { Filter, Plus } from 'lucide-react';

export default function AddFilterDropdown({ filters, state, onAdd }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="it-dropdown-button w-full justify-start"
                >
                    <Filter className="me-2 size-4" />
                    <span>{trans('filters_button')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="it-add-filter-dropdown it-dropdown-items w-max min-w-24">
                <DropdownMenuLabel className="it-dropdown-header">{trans('add_filter_header')}</DropdownMenuLabel>
                <DropdownMenuSeparator className="it-dropdown-separator" />
                {filters.map((filter, key) => (
                    <DropdownMenuItem
                        key={key}
                        disabled={state[filter.attribute].enabled}
                        onClick={() => onAdd(filter)}
                        className="it-dropdown-item"
                    >
                        {!state[filter.attribute].enabled && <Plus className="me-2 size-3.5" />}
                        <span>{filter.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
