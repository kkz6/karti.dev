import clsx from 'clsx'

export default function Button({
    as: Component = 'button',
    type = 'button',
    sr = '',
    primary = false, // Deprecated
    danger = false, // Deprecated
    small = false,
    disabled = false,
    className = '',
    variant = null,
    customVariantClass = '',
    children,
    ...props
}) {
    if (!variant) {
        variant = primary ? 'info' : danger ? 'danger' : 'default'
    }

    function getClassesForButtonVariant(variant) {
        const baseClasses = {
            info: [
                'it-primary-button it-info-button border-transparent bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500 active:bg-blue-700',
                'dark:bg-blue-500 dark:text-white dark:hover:bg-blue-400 dark:focus:ring-offset-blue-800',
            ],
            danger: [
                'it-danger-button border-transparent bg-red-600 text-white hover:bg-red-500 focus:ring-red-500 active:bg-red-700',
                'dark:bg-red-500 dark:text-white dark:hover:bg-red-400 dark:focus:ring-offset-red-800',
            ],
            default: [
                'it-default-button border-gray-300 bg-white text-gray-700 hover:text-gray-500 focus:ring-gray-500 hover:bg-gray-50 focus:ring-blue-500',
                'dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-800 dark:hover:text-zinc-300',
            ],
            success: [
                'it-success-button border border-emerald-600 bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 hover:border-emerald-500 focus:ring-emerald-500 active:bg-emerald-700 active:border-emerald-700',
                'dark:bg-emerald-600 dark:border-emerald-500 dark:hover:bg-emerald-500 dark:hover:border-emerald-400 dark:focus:ring-offset-emerald-800',
            ],
            warning: [
                'it-warning-button border border-amber-600 bg-amber-600 text-white shadow-sm hover:bg-amber-500 hover:border-amber-500 focus:ring-amber-500 active:bg-amber-700 active:border-amber-700',
                'dark:bg-amber-600 dark:border-amber-500 dark:hover:bg-amber-500 dark:hover:border-amber-400 dark:focus:ring-offset-amber-800',
            ],
        }

        return baseClasses[variant] || baseClasses.default
    }

    return (
        <Component
            disabled={disabled}
            className={clsx(
                'it-button inline-flex items-center rounded-md border text-sm font-semibold shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2',
                small ? 'px-2 py-1' : 'px-3 py-2',
                disabled ? 'cursor-not-allowed opacity-50' : '',
                customVariantClass || getClassesForButtonVariant(variant),
                className,
            )}
            type={type}
            {...props}
        >
            {sr && <span className="sr-only">{sr}</span>}
            {children}
        </Component>
    )
}
