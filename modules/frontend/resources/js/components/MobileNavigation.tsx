import { Link } from '@inertiajs/react'
import { ChevronDown, X } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const navigation = [
  { name: 'About', href: '/about' },
  { name: 'Articles', href: '/articles' },
  { name: 'Projects', href: '/projects' },
  { name: 'Speaking', href: '/speaking' },
  { name: 'Photography', href: '/photography' },
  { name: 'Uses', href: '/uses' },
]

function MobileNavItem({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <li>
      <Link
        href={href}
        className="block py-2"
        onClick={onClick}
      >
        {children}
      </Link>
    </li>
  )
}

export function MobileNavigation(
  props: React.ComponentPropsWithoutRef<'div'>
) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div {...props}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10 dark:hover:ring-white/20"
      >
        Menu
        <ChevronDown className={clsx(
          "ml-3 h-auto w-2 stroke-zinc-500 group-hover:stroke-zinc-700 dark:group-hover:stroke-zinc-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl bg-white p-6 shadow-xl ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800 z-50">
            <nav>
              <ul className="-my-2 divide-y divide-zinc-100 text-base text-zinc-800 dark:divide-zinc-100/5 dark:text-zinc-300">
                {navigation.map((item) => (
                  <MobileNavItem
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </MobileNavItem>
                ))}
              </ul>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}