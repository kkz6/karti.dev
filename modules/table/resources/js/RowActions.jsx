import { MoreHorizontal } from 'lucide-react';
import { useCallback, useMemo } from 'react'
import clsx from 'clsx'

import { getActionForItem } from './urlHelpers'
import Actions from './Actions.jsx'
import { Button } from '@shared/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@shared/components/ui/dropdown-menu'
import DynamicIcon from './DynamicIcon'

export default function RowActions({ item, actions, performAction, iconResolver, asDropdown = false, onSuccess = null, onError = null, onHandle = null }) {
    const componentType = useCallback(
        (action, key) => {
            // Check if we have action data for this item
            if (!item._actions || !item._actions[key]) {
                // Fallback based on action type
                return action.type === 'link' ? 'a' : Button
            }

            const actionItem = getActionForItem(item._actions[key], action)

            if (actionItem?.componentType === 'button-component') {
                return asDropdown ? 'button' : Button
            }

            // Return the component type or default to 'a' for links, 'button' for others
            return actionItem?.componentType || (actionItem?.type === 'link' ? 'a' : Button)
        },
        [item],
    )

    const actionIsVisible = useCallback(
        (action, key) => {
            // Check if we have action data for this item
            if (!item._actions || !item._actions[key]) {
                return true // Default to visible
            }

            return getActionForItem(item._actions[key], action)?.isVisible ?? true
        },
        [item],
    )

    const componentBindings = useCallback(
        (action, key, handle) => {
            // Check if we have action data for this item
            if (!item._actions || !item._actions[key]) {
                // Return basic bindings for the action
                return {
                    onClick: () => handle(action),
                    disabled: !action.authorized
                }
            }

            const actionItem = getActionForItem(item._actions[key], action)

            if (!actionItem) {
                return {
                    onClick: () => handle(action),
                    disabled: !action.authorized
                }
            }

            if (actionItem.componentType != 'button-component') {
                actionItem.bindings.class = actionItem.linkClass || getClassesForLinkVariant(actionItem.variant).join(' ')
            }

            if (actionItem.bindings?.class) {
                actionItem.bindings.className = actionItem.bindings.class
                delete actionItem.bindings.class
            }

            if (!actionItem.asDownload) {
                actionItem.bindings = actionItem.bindings || {}
                actionItem.bindings.onClick = () => handle(action)
            }

            if (actionItem.type === 'link') {
                actionItem.bindings.className = actionItem.bindings?.className || ''
                actionItem.bindings.className += asDropdown ? '' : ' it-row-actions-link flex flex-row items-center'

                if (actionItem.bindings?.disabled) {
                    actionItem.bindings.className += ' cursor-not-allowed opacity-50'
                }
            }

            // Convert custom button props to shadcn variants
            if (actionItem.componentType === 'button-component' && actionItem.bindings) {
                // Convert size prop
                if (actionItem.bindings.small) {
                    actionItem.bindings.size = 'sm'
                    delete actionItem.bindings.small
                }

                // Convert variant props
                if (actionItem.bindings.primary) {
                    actionItem.bindings.variant = 'default'
                    delete actionItem.bindings.primary
                } else if (actionItem.bindings.danger) {
                    actionItem.bindings.variant = 'destructive'
                    delete actionItem.bindings.danger
                } else if (actionItem.bindings.variant === 'info') {
                    actionItem.bindings.variant = 'default'
                } else if (actionItem.bindings.variant === 'success') {
                    actionItem.bindings.variant = 'default'
                } else if (actionItem.bindings.variant === 'warning') {
                    actionItem.bindings.variant = 'default'
                } else if (!actionItem.bindings.variant) {
                    actionItem.bindings.variant = 'outline'
                }

                // Remove custom props that don't exist in shadcn
                delete actionItem.bindings.customVariantClass
                delete actionItem.bindings.sr
            }

            if (asDropdown && actionItem.bindings) {
                delete actionItem.bindings.primary
                delete actionItem.bindings.danger
                delete actionItem.bindings.small
            }

            return actionItem.bindings || {}
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={clsx(
                                    'it-row-actions-dropdown inline-flex size-6 rounded p-0.5 transition-colors dark:text-zinc-300 dark:hover:bg-zinc-800 hover:bg-gray-200/75 data-[state=open]:bg-gray-200/75 dark:data-[state=open]:bg-zinc-800'
                                )}
                                aria-label="Actions"
                            >
                                <MoreHorizontal className="size-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="it-dropdown-items w-max min-w-24">
                            {actions.map((action, key) =>
                                actionIsVisible(action, key) ? (
                                    <DropdownMenuItem
                                        key={key}
                                        disabled={!action.authorized}
                                        onClick={() => handle(action)}
                                        className="it-dropdown-item"
                                    >
                                        {hasVisibleActionsWithIcons && action.icon && (
                                            <DynamicIcon
                                                className="it-row-actions-dropdown-icon me-2 size-3.5"
                                                resolver={iconResolver}
                                                icon={action.icon}
                                                context={action}
                                            />
                                        )}
                                        <span>{action.label}</span>
                                    </DropdownMenuItem>
                                ) : null,
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="it-row-actions flex items-center space-x-2 text-sm font-medium rtl:space-x-reverse">
                        {actions.map((action, key) => {
                            const Component = componentType(action, key)
                            // Safety check to ensure Component is never undefined
                            if (!Component || action.asRowAction === false || !actionIsVisible(action, key)) {
                                return null
                            }
                            return (
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
                            )
                        })}
                    </div>
                )
            }
        </Actions>
    )
}
