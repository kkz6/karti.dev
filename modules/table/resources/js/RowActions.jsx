import { MoreHorizontal } from 'lucide-react';
import { useCallback, useMemo } from 'react'
import clsx from 'clsx'

import { getActionForItem } from './urlHelpers'
import Actions from './Actions.jsx'
import Button from './Button'
import Dropdown from './Dropdown'
import DropdownItem from './DropdownItem'
import DynamicIcon from './DynamicIcon'

export default function RowActions({ item, actions, performAction, iconResolver, asDropdown = false, onSuccess = null, onError = null, onHandle = null }) {
    const componentType = useCallback(
        (action, key) => {
            const actionItem = getActionForItem(action, item._actions[key])

            if (actionItem.componentType === 'button-component') {
                return asDropdown ? 'button' : Button
            }

            return actionItem.componentType
        },
        [item],
    )

    const actionIsVisible = useCallback(
        (action, key) => {
            return getActionForItem(action, item._actions[key]).isVisible
        },
        [item],
    )

    const componentBindings = useCallback(
        (action, key, handle) => {
            const actionItem = getActionForItem(action, item._actions[key])

            if (actionItem.componentType != 'button-component') {
                actionItem.bindings.class = actionItem.linkClass || getClassesForLinkVariant(actionItem.variant).join(' ')
            }

            if (actionItem.bindings.class) {
                actionItem.bindings.className = actionItem.bindings.class
                delete actionItem.bindings.class
            }

            if (!actionItem.asDownload) {
                actionItem.bindings.onClick = () => handle(action)
            }

            if (actionItem.type === 'link') {
                actionItem.bindings.className = actionItem.bindings.className || ''
                actionItem.bindings.className += asDropdown ? '' : ' it-row-actions-link flex flex-row items-center'

                if (actionItem.bindings.disabled) {
                    actionItem.bindings.className += ' cursor-not-allowed opacity-50'
                }
            }

            if (asDropdown) {
                delete actionItem.bindings.primary
                delete actionItem.bindings.danger
                delete actionItem.bindings.small
            }

            return actionItem.bindings
        },
        [item],
    )

    function getClassesForLinkVariant(variant) {
        const baseClasses = {
            info: [
                'it-primary-link it-info-link text-blue-600 hover:text-blue-500 focus:ring-blue-500',
                'dark:text-blue-400 dark:hover:text-blue-300 dark:focus:ring-offset-blue-800',
            ],
            danger: [
                'it-danger-link text-red-600 hover:text-red-500 focus:ring-red-500',
                'dark:text-red-400 dark:hover:text-red-300 dark:focus:ring-offset-red-800',
            ],
            default: [
                'it-default-link text-gray-700 hover:text-gray-500 focus:ring-gray-500',
                'dark:text-zinc-300 dark:hover:text-zinc-300 dark:focus:ring-offset-zinc-800',
            ],
            success: [
                'it-success-link text-emerald-600 hover:text-emerald-500 focus:ring-emerald-500',
                'dark:text-emerald-400 dark:hover:text-emerald-300 dark:focus:ring-offset-emerald-800',
            ],
            warning: [
                'it-warning-link text-amber-600 hover:text-amber-500 focus:ring-amber-500',
                'dark:text-amber-400 dark:hover:text-amber-300 dark:focus:ring-offset-amber-800',
            ],
        }

        return baseClasses[variant] || baseClasses.default
    }

    const hasVisibleActionsWithIcons = useMemo(() => {
        return actions.some((action, key) => actionIsVisible(action, key) && action.icon)
    })

    return (
        <Actions
            actions={actions}
            iconResolver={iconResolver}
            item={item}
            performAction={performAction}
            onError={onError}
            keys={[item._primary_key]}
            onHandle={onHandle}
            onSuccess={onSuccess}
        >
            {({ handle }) =>
                asDropdown ? (
                    <Dropdown className="it-row-actions-dropdown inline-flex">
                        {{
                            trigger: (open) => (
                                <MoreHorizontal
                                    className={clsx({
                                        'size-6 rounded p-0.5 transition-colors dark:text-zinc-300 dark:hover:bg-zinc-800': true,
                                        'bg-gray-200/75 dark:bg-zinc-800': open,
                                    })}
                                />
                            ),
                            content: () =>
                                actions.map((action, key) =>
                                    actionIsVisible(action, key) ? (
                                        <DropdownItem
                                            as={componentType(action, key)}
                                            key={key}
                                            title={action.label}
                                            disabled={!action.authorized}
                                            {...componentBindings(action, key, handle)}
                                            icon={
                                                hasVisibleActionsWithIcons ? (
                                                    <DynamicIcon
                                                        className="it-row-actions-dropdown-icon"
                                                        resolver={iconResolver}
                                                        icon={action.icon}
                                                        context={action}
                                                    />
                                                ) : null
                                            }
                                        />
                                    ) : null,
                                ),
                        }}
                    </Dropdown>
                ) : (
                    <div className="it-row-actions flex items-center space-x-2 text-sm font-medium rtl:space-x-reverse">
                        {actions.map((action, key) => {
                            const Component = componentType(action, key)
                            return action.asRowAction && actionIsVisible(action, key) ? (
                                <Component
                                    key={key}
                                    title={action.label}
                                    {...componentBindings(action, key, handle)}
                                >
                                    {action.icon && (
                                        <DynamicIcon
                                            resolver={iconResolver}
                                            icon={action.icon}
                                            context={action}
                                            className="it-row-actions-icon size-4"
                                        />
                                    )}
                                    {action.showLabel && <span className={action.icon ? 'ms-1' : ''}>{action.label}</span>}
                                </Component>
                            ) : null
                        })}
                    </div>
                )
            }
        </Actions>
    )
}
