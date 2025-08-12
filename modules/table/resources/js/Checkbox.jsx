import clsx from 'clsx'

export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={clsx(
                'it-checkbox-input rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
                'dark:border-zinc-700 dark:bg-zinc-900 dark:text-blue-500 dark:focus:ring-blue-600 dark:focus:ring-offset-zinc-800',
                className,
            )}
        />
    )
}
