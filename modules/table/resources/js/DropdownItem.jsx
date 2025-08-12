import clsx from 'clsx'
import { MenuItem } from '@headlessui/react'

export default function DropdownItem({
    as: Component = 'button',
    checked = false,
    disabled = false,
    hideIcon = false,
    download = false,
    title,
    children,
    icon,
    onClick,
    className,
    ...props
}) {
    return (
        <MenuItem>
            {({ focus }) => (
                <Component
                    type="button"
                    checked={checked}
                    aria-checked={checked}
                    download={download}
                    disabled={disabled}
                    role="menuitem"
                    className={clsx(
                        'it-dropdown-item relative flex w-full select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                        className,
                        {
                            'cursor-not-allowed opacity-50': disabled,
                            'bg-gray-100 dark:bg-zinc-700': focus,
                        },
                    )}
                    title={title}
                    onClick={onClick}
                    {...props}
                >
                    {icon ? <div className={clsx('me-2 size-3.5', hideIcon ? 'opacity-0' : '')}>{icon}</div> : null}
                    {title}
                    {children}
                </Component>
            )}
        </MenuItem>
    )
}
