import clsx from 'clsx';
import { MoreHorizontal } from 'lucide-react';
import React, { useCallback, useMemo } from 'react';

import { Button } from '@shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import DynamicIcon from './DynamicIcon';
import TableActions from './TableActions';
import type { RowActionsProps, TableAction } from './types';
import { getActionForItem } from './urlHelpers';

export default function RowActions({
    item,
    actions,
    performAction,
    iconResolver,
    asDropdown = false,
    onSuccess = null,
    onError = null,
    onHandle = null,
}: RowActionsProps): React.ReactElement {
    const componentType = useCallback(
        (action: TableAction, key: number): React.ComponentType<any> | string => {
            // Check if we have action data for this item
            if (!item._actions || !item._actions[key]) {
                // Fallback based on action type
                return action.type === 'link' ? 'a' : Button;
            }

            const actionItem = getActionForItem(item._actions[key] as any, action);

            if (actionItem?.componentType === 'button-component') {
                return asDropdown ? 'button' : Button;
            }

            // Return the component type or default to 'a' for links, 'button' for others
            return actionItem?.componentType || (action.type === 'link' ? 'a' : Button);
        },
        [item, asDropdown],
    );

    const actionIsVisible = useCallback(
        (action: TableAction, key: number): boolean => {
            // Check if we have action data for this item
            if (!item._actions || !item._actions[key]) {
                return true; // Default to visible
            }

            return getActionForItem(item._actions[key], action)?.isVisible ?? true;
        },
        [item],
    );

    const componentBindings = useCallback(
        (action: TableAction, key: number, handle: (action: TableAction) => void): Record<string, any> => {
            // Check if we have action data for this item
            if (!item._actions || !item._actions[key]) {
                // Return basic bindings for the action
                return {
                    onClick: () => handle(action),
                    disabled: !action.authorized,
                };
            }

            const actionItem = getActionForItem(item._actions[key] as any, action);

            if (!actionItem) {
                return {
                    onClick: () => handle(action),
                    disabled: !action.authorized,
                };
            }

            // Create a mutable copy to avoid readonly issues
            const mutableActionItem = { ...actionItem };

            if (mutableActionItem.componentType != 'button-component') {
                mutableActionItem.bindings = mutableActionItem.bindings || {};
                mutableActionItem.bindings.class =
                    (mutableActionItem as any).linkClass || getClassesForLinkVariant((mutableActionItem as any).variant || 'default').join(' ');
            }

            if (mutableActionItem.bindings?.class) {
                mutableActionItem.bindings.className = mutableActionItem.bindings.class;
                delete mutableActionItem.bindings.class;
            }

            if (!mutableActionItem.asDownload) {
                mutableActionItem.bindings = mutableActionItem.bindings || {};
                mutableActionItem.bindings.onClick = () => handle(action);
            }

            if (mutableActionItem.type === 'link') {
                mutableActionItem.bindings = mutableActionItem.bindings || {};
                mutableActionItem.bindings.className = mutableActionItem.bindings?.className || '';
                mutableActionItem.bindings.className += asDropdown ? '' : ' it-row-actions-link flex flex-row items-center';

                if (mutableActionItem.bindings?.disabled) {
                    mutableActionItem.bindings.className += ' cursor-not-allowed opacity-50';
                }
            }

            // Convert custom button props to shadcn variants
            if (mutableActionItem.componentType === 'button-component' && mutableActionItem.bindings) {
                // Convert size prop
                if (mutableActionItem.bindings.small) {
                    mutableActionItem.bindings.size = 'sm';
                    delete mutableActionItem.bindings.small;
                }

                // Convert variant props
                if (mutableActionItem.bindings.primary) {
                    mutableActionItem.bindings.variant = 'default';
                    delete mutableActionItem.bindings.primary;
                } else if (mutableActionItem.bindings.danger) {
                    mutableActionItem.bindings.variant = 'destructive';
                    delete mutableActionItem.bindings.danger;
                } else if (mutableActionItem.bindings.variant === 'info') {
                    mutableActionItem.bindings.variant = 'default';
                } else if (mutableActionItem.bindings.variant === 'success') {
                    mutableActionItem.bindings.variant = 'default';
                } else if (mutableActionItem.bindings.variant === 'warning') {
                    mutableActionItem.bindings.variant = 'default';
                } else if (!mutableActionItem.bindings.variant) {
                    mutableActionItem.bindings.variant = 'outline';
                }

                // Remove custom props that don't exist in shadcn
                delete mutableActionItem.bindings.customVariantClass;
                delete mutableActionItem.bindings.sr;
            }

            if (asDropdown && mutableActionItem.bindings) {
                delete mutableActionItem.bindings.primary;
                delete mutableActionItem.bindings.danger;
                delete mutableActionItem.bindings.small;
            }

            return mutableActionItem.bindings || {};
        },
        [item, asDropdown],
    );

    function getClassesForLinkVariant(variant: string): string[] {
        const baseClasses: Record<string, string[]> = {
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
        };

        return baseClasses[variant] || baseClasses.default;
    }

    const hasVisibleActionsWithIcons = useMemo((): boolean => {
        return actions.some((action, key) => actionIsVisible(action, key) && action.icon);
    }, [actions, actionIsVisible]);

    return (
        <TableActions
            actions={actions}
            iconResolver={iconResolver!}
            item={item}
            performAction={performAction}
            onError={onError}
            keys={[item._primary_key]}
            onHandle={onHandle}
            onSuccess={onSuccess}
        >
            {({ handle }: { handle: (action: TableAction) => void }) =>
                asDropdown ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={clsx(
                                    'it-row-actions-dropdown inline-flex items-center justify-center size-8 rounded cursor-pointer transition-colors hover:bg-gray-100 data-[state=open]:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:data-[state=open]:bg-zinc-800',
                                )}
                                aria-label="Actions"
                            >
                                <MoreHorizontal className="size-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="it-dropdown-items w-max min-w-24 bg-black text-white border-zinc-800">
                            {actions.map((action, key) =>
                                actionIsVisible(action, key) ? (
                                    <DropdownMenuItem
                                        key={key}
                                        disabled={!action.authorized}
                                        onClick={() => handle(action)}
                                        className="it-dropdown-item text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white"
                                    >
                                        {hasVisibleActionsWithIcons && action.icon && (
                                            <DynamicIcon
                                                className="it-row-actions-dropdown-icon me-2 size-3.5 text-white"
                                                resolver={iconResolver as any}
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
                            const Component = componentType(action, key);
                            // Safety check to ensure Component is never undefined
                            if (!Component || action.asRowAction === false || !actionIsVisible(action, key)) {
                                return null;
                            }
                            return (
                                <Component key={key} title={action.label} {...componentBindings(action, key, handle)}>
                                    {action.icon && (
                                        <DynamicIcon
                                            resolver={iconResolver as any}
                                            icon={action.icon}
                                            context={action}
                                            className="it-row-actions-icon size-4"
                                        />
                                    )}
                                    {action.showLabel && <span className={action.icon ? 'ms-1' : ''}>{action.label}</span>}
                                </Component>
                            );
                        })}
                    </div>
                )
            }
        </TableActions>
    );
}
