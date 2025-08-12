import { useMemo } from 'react'
import { Settings, List, Wrench } from 'lucide-react';

import { trans } from './translations.js'
import Actions from './Actions.jsx'
import Dropdown from './Dropdown'
import DropdownButton from './DropdownButton'
import DropdownHeader from './DropdownHeader'
import DropdownItem from './DropdownItem'
import DropdownSeparator from './DropdownSeparator'
import DynamicIcon from './DynamicIcon'

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
}) {
    const hasBulkActions = useMemo(() => actions.filter((action) => action.asBulkAction).length > 0, [actions])
    const hasExports = useMemo(() => exports.length > 0, [exports])
    const hasSelectedItems = useMemo(() => selectedItems.length > 0, [selectedItems])

    function makeExportUrl(tableExport) {
        if (!tableExport.limitToSelectedRows) {
            return tableExport.url
        }

        return `${tableExport.url}&keys=${selectedItems.join(',')}`
    }

    return (
        <Actions
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
                <Dropdown className="it-actions-dropdown">
                    {{
                        trigger: () => (
                            <DropdownButton
                                title={trans('actions_button')}
                                icon={<Wrench />}
                            />
                        ),
                        content: () => (
                            <>
                                {hasExports && (
                                    <div>
                                        <DropdownHeader>{trans('exports_header')}</DropdownHeader>
                                        <DropdownSeparator />
                                        {exports.map((tableExport, key) => (
                                            <DropdownItem
                                                key={key}
                                                title={tableExport.label}
                                                as={tableExport.asDownload ? 'a' : 'button'}
                                                download={tableExport.asDownload ? 'download' : null}
                                                {...(tableExport.dataAttributes || {})}
                                                {...(tableExport.asDownload
                                                    ? { href: makeExportUrl(tableExport) }
                                                    : { onClick: () => asyncExport(tableExport) })}
                                                icon={<List />}
                                            />
                                        ))}
                                    </div>
                                )}

                                {hasBulkActions && hasExports && <DropdownSeparator />}

                                {hasBulkActions && (
                                    <div>
                                        <DropdownHeader>{trans('bulk_actions_header')}</DropdownHeader>
                                        <DropdownSeparator />
                                        {actions.map((action, key) =>
                                            action.asBulkAction ? (
                                                <DropdownItem
                                                    key={key}
                                                    title={action.label}
                                                    disabled={!hasSelectedItems || !action.authorized}
                                                    onClick={() => handle(action)}
                                                    {...(action.dataAttributes || {})}
                                                    icon={
                                                        action.icon ? (
                                                            <DynamicIcon
                                                                className="it-actions-dropdown-icon"
                                                                resolver={iconResolver}
                                                                icon={action.icon}
                                                                context={action}
                                                            />
                                                        ) : (
                                                            <Settings />
                                                        )
                                                    }
                                                />
                                            ) : null,
                                        )}
                                    </div>
                                )}
                            </>
                        ),
                    }}
                </Dropdown>
            )}
        </Actions>
    )
}
