import { Button } from '@shared/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { useLang } from '@shared/hooks/use-lang';
import { Eye } from 'lucide-react';
import React from 'react';
import type { ToggleColumnDropdownProps } from './types';

export default function ToggleColumnDropdown({ columns, state, onToggle }: ToggleColumnDropdownProps): React.ReactElement {
    const { t } = useLang();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="it-dropdown-button justify-center">
                    <Eye className="me-2 size-4" />
                    <span>{t('table::table.columns_button')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="it-toggle-column-dropdown it-dropdown-items w-max min-w-24">
                <DropdownMenuLabel className="it-dropdown-header">{t('table::table.toggle_columns_header')}</DropdownMenuLabel>
                <DropdownMenuSeparator className="it-dropdown-separator" />
                {columns.map((column, key) =>
                    column.header ? (
                        <DropdownMenuCheckboxItem
                            key={key}
                            checked={state[column.attribute]}
                            disabled={!column.toggleable}
                            onCheckedChange={() => onToggle(column)}
                            className="it-dropdown-item"
                        >
                            <span>{column.header}</span>
                        </DropdownMenuCheckboxItem>
                    ) : null,
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
