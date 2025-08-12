import clsx from 'clsx'
import DynamicIcon from './DynamicIcon'

export default function Badge({ data, iconResolver }) {
    return (
        <div
            className={clsx('it-badge inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium', {
                'it-badge-info border-blue-300/75 bg-blue-100/50 text-blue-800 dark:border-blue-600/75 dark:bg-blue-700/50 dark:text-blue-100':
                    data.variant === 'info',
                'it-badge-success border-green-300/75 bg-green-100/50 text-green-800 dark:border-green-600/75 dark:bg-green-700/50 dark:text-green-100':
                    data.variant === 'success',
                'it-badge-warning bg-bg-yellow-100/50 border-yellow-300/75 text-yellow-800 dark:border-yellow-600/75 dark:bg-yellow-700/50 dark:text-yellow-100':
                    data.variant === 'warning',
                'it-badge-danger border-red-300/75 bg-red-100/50 text-red-800 dark:border-red-600/75 dark:bg-red-700/50 dark:text-red-100':
                    data.variant === 'danger',
                'it-badge-default border-gray-300/75 bg-gray-100/50 text-gray-800 dark:border-zinc-600/75 dark:bg-zinc-700/50 dark:text-zinc-100':
                    !data.variant || data.variant === 'default',
            })}
            data-style={data.variant}
            data-variant={data.variant}
        >
            {data.icon && (
                <DynamicIcon
                    resolver={iconResolver}
                    icon={data.icon}
                    context={data}
                    className="it-badge-icon me-1 size-4"
                />
            )}
            <span>{data.value}</span>
        </div>
    )
}
