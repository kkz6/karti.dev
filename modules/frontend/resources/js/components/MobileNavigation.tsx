import { Link } from '@inertiajs/react'
import { ChevronDown, X } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

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

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <div {...props} className="relative pointer-events-auto">
      <button
        type="button"
        onClick={handleToggle}
        className="group flex items-center rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-sm transition dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10 dark:hover:ring-white/20 h-10 pointer-events-auto relative z-10"
      >
        Menu
        <ChevronDown className={clsx(
          "ml-3 h-auto w-2 stroke-zinc-500 group-hover:stroke-zinc-700 dark:group-hover:stroke-zinc-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50">
            <motion.div
              className="absolute inset-0 bg-zinc-800/40 backdrop-blur dark:bg-black/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={handleClose}
            />
            <motion.div
              className="fixed inset-x-4 top-8 z-50 origin-top rounded-3xl bg-white p-8 ring-1 ring-zinc-900/5 dark:bg-zinc-900 dark:ring-zinc-800"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <div className="flex flex-row-reverse items-center justify-between">
                <button
                  type="button"
                  onClick={handleClose}
                  className="-m-1 p-1"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
                </button>
                <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Navigation
                </h2>
              </div>
              <nav className="mt-6">
                <ul className="-my-2 divide-y divide-zinc-100 text-base text-zinc-800 dark:divide-zinc-100/5 dark:text-zinc-300">
                  {navigation.map((item) => (
                    <MobileNavItem
                      key={item.href}
                      href={item.href}
                      onClick={handleClose}
                    >
                      {item.name}
                    </MobileNavItem>
                  ))}
                </ul>
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}