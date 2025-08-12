import { Button } from '@shared/components/ui/button';
import { InboxIcon } from 'lucide-react';
import DynamicIcon from './DynamicIcon';
import type { Action, EmptyStateProps, UrlConfig } from './types';
import { visitUrl } from './urlHelpers';

export default function EmptyState({
    title = '',
    message = '',
    actions = [],
    icon = true,
    iconResolver = null,
    dataAttributes = {},
}: EmptyStateProps) {
    function handleAction(url: Action['url']): void {
        if (url && typeof url === 'object') {
            visitUrl(url.url);
        }
    }

    return (
        <div
            className="it-empty-state flex min-h-32 flex-col items-center justify-center rounded-md border bg-gray-50 p-8 dark:border-zinc-700 dark:bg-zinc-900"
            {...dataAttributes}
        >
            {icon !== false && (
                <div className="it-empty-state-icon-wrapper mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
                    <DynamicIcon
                        resolver={icon === true ? () => InboxIcon : iconResolver}
                        icon={icon === true ? 'InboxIcon' : icon}
                        context={null}
                        className="size-6 text-gray-500 dark:text-gray-400"
                    />
                </div>
            )}

            <h3 className="text-center text-lg font-medium text-gray-900 dark:text-zinc-100">{title}</h3>

            {message && <p className="mt-2 text-center text-gray-600 dark:text-zinc-400">{message}</p>}

            <div className="it-empty-state-actions mt-4 flex flex-wrap items-center justify-center gap-2">
                {actions
                    .filter((action: Action) => !action.url?.hidden)
                    .map((action: Action, key: number) =>
                        action.url?.asDownload ? (
                            <a
                                key={key}
                                className={action.buttonClass}
                                download={action.url?.asDownload === true ? '' : action.url?.asDownload}
                                href={action.url?.url}
                                {...(action.dataAttributes || {})}
                            >
                                {action.icon && iconResolver && (
                                    <DynamicIcon
                                        className="it-empty-state-action-button-icon me-2 size-4"
                                        resolver={iconResolver}
                                        icon={action.icon}
                                        context={null}
                                    />
                                )}
                                {action.label}
                            </a>
                        ) : (
                            <Button
                                key={key}
                                className={action.buttonClass}
                                disabled={action.url?.disabled}
                                variant={action.variant}
                                onClick={() => handleAction(action.url)}
                                {...(action.dataAttributes || {})}
                            >
                                {action.icon && iconResolver && (
                                    <DynamicIcon
                                        className="it-empty-state-action-button-icon me-2 size-4"
                                        resolver={iconResolver}
                                        icon={action.icon}
                                        context={null}
                                    />
                                )}
                                {action.label}
                            </Button>
                        ),
                    )}
            </div>
        </div>
    );
}
