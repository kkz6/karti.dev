import { Menu, MenuButton, MenuItems } from '@headlessui/react'
import { clsx } from 'clsx'

export default function Dropdown({ placement = 'bottom start', className = '', offset = 8, children }) {
    return (
        <Menu
            as="div"
            className={clsx('it-dropdown', className)}
        >
            <MenuButton>{({ open }) => children.trigger({ open })}</MenuButton>
            <MenuItems
                transition
                anchor={{
                    to: placement,
                    offset,
                }}
                className="it-dropdown-items z-20 w-max min-w-24 rounded-md bg-white p-1 shadow-lg ring-1 ring-black/5 transition duration-200 ease-out [--anchor-gap:8px] data-[closed]:scale-95 data-[closed]:opacity-0 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-zinc-800/50 dark:ring-zinc-700"
            >
                {({ open }) => children.content({ open })}
            </MenuItems>
        </Menu>
    )
}
