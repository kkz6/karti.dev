import { useLang } from '@shared/hooks/use-lang'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from '@shared/components/ui/dropdown-menu'
import { Button } from '@shared/components/ui/button'
import { Check, Eye } from 'lucide-react';

export default function ToggleColumnDropdown({ columns, state, onToggle }) {
    const { t } = useLang();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="it-dropdown-button w-full justify-start"
                >
                    <Eye className="me-2 size-4" />
                    <span>{t('table::table.columns_button')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="it-toggle-column-dropdown it-dropdown-items w-max min-w-24">
                <DropdownMenuLabel className="it-dropdown-header">{t('table::table.toggle_columns_header')}</DropdownMenuLabel>
                <DropdownMenuSeparator className="it-dropdown-separator" />
                {columns.map(
                    (column, key) =>
                        column.header && (
                            <DropdownMenuCheckboxItem
                                key={key}
                                checked={state[column.attribute]}
                                disabled={!column.toggleable}
                                onCheckedChange={() => onToggle(column)}
                                className="it-dropdown-item"
                            >
                                <span>{column.header}</span>
                            </DropdownMenuCheckboxItem>
                        ),
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
