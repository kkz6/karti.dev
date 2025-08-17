import { List, Settings, Wrench } from 'lucide-react';
import { useMemo } from 'react';

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
import type { ActionsDropdownProps, TableExport } from '@table/types';
import DynamicIcon from './DynamicIcon';
import TableActions from './TableActions';

export default function ActionsDropdown({
    actions,
    exports,
    selectedItems,
    performAction,
    performAsyncExport,
    iconResolver,
    onSuccess = null,
    onError = null,
    onHandle = null,
}: ActionsDropdownProps) {
    const { t } = useLang();
    const hasBulkActions = useMemo(() => actions.filter((action) => action.asBulkAction).length > 0, [actions]);
    const hasExports = useMemo(() => exports.length > 0, [exports]);
    const hasSelectedItems = useMemo(() => selectedItems.length > 0, [selectedItems]);

    function makeExportUrl(tableExport: TableExport): string {
        if (!tableExport.limitToSelectedRows) {
            return tableExport.url;
        }

        return `${tableExport.url}&keys=${selectedItems.join(',')}`;
    }

    return (
        <TableActions
            actions={actions}
            iconResolver={iconResolver}
            keys={selectedItems}
            onError={onError}
            performAction={performAction}
            performAsyncExport={performAsyncExport}
            onHandle={onHandle}
            onSuccess={onSuccess}
        >
            {({ handle, asyncExport }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="it-dropdown-button justify-center">
                            <Wrench className="me-2 size-4" />
                            <span>{t('table::table.actions_button')}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="it-actions-dropdown it-dropdown-items w-max min-w-24">
                        {hasExports && (
                            <>
                                <DropdownMenuLabel className="it-dropdown-header">{t('table::table.exports_header')}</DropdownMenuLabel>
                                <DropdownMenuSeparator className="it-dropdown-separator" />
                                {exports.map((tableExport, key) => (
                                    <DropdownMenuItem
                                        key={key}
                                        asChild={tableExport.asDownload}
                                        className="it-dropdown-item"
                                        {...(tableExport.dataAttributes || {})}
                                    >
                                        {tableExport.asDownload ? (
                                            <a href={makeExportUrl(tableExport)} download className="flex items-center">
                                                <List className="me-2 size-3.5" />
                                                <span>{tableExport.label}</span>
                                            </a>
                                        ) : (
                                            <div onClick={() => asyncExport(tableExport)} className="flex items-center">
                                                <List className="me-2 size-3.5" />
                                                <span>{tableExport.label}</span>
                                            </div>
                                        )}
                                    </DropdownMenuItem>
                                ))}
                            </>
                        )}

                        {hasBulkActions && hasExports && <DropdownMenuSeparator className="it-dropdown-separator" />}

                        {hasBulkActions && (
                            <>
                                <DropdownMenuLabel className="it-dropdown-header">{t('table::table.bulk_actions_header')}</DropdownMenuLabel>
                                <DropdownMenuSeparator className="it-dropdown-separator" />
                                {actions.map((action, key) =>
                                    action.asBulkAction ? (
                                        <DropdownMenuItem
                                            key={key}
                                            disabled={!hasSelectedItems || !action.authorized}
                                            onClick={() => handle(action)}
                                            className="it-dropdown-item"
                                            {...(action.dataAttributes || {})}
                                        >
                                            {action.icon ? (
                                                <DynamicIcon
                                                    className="it-actions-dropdown-icon me-2 size-3.5"
                                                    resolver={iconResolver}
                                                    icon={action.icon}
                                                    context={action}
                                                />
                                            ) : (
                                                <Settings className="me-2 size-3.5" />
                                            )}
                                            <span>{action.label}</span>
                                        </DropdownMenuItem>
                                    ) : null,
                                )}
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </TableActions>
    );
}
