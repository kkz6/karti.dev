import { useLang } from '@shared/hooks/use-lang'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@shared/components/ui/dropdown-menu'
import { Button } from '@shared/components/ui/button'
import { Filter, Plus } from 'lucide-react';

export default function AddFilterDropdown({ filters, state, onAdd }) {
    const { t } = useLang();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="it-dropdown-button w-full justify-start"
                >
                    <Filter className="me-2 size-4" />
                    <span>{t('table::table.filters_button')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="it-add-filter-dropdown it-dropdown-items w-max min-w-24">
                <DropdownMenuLabel className="it-dropdown-header">{t('table::table.add_filter_header')}</DropdownMenuLabel>
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
