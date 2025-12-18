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
        className="block py-2 font-mono text-sm transition hover:text-primary"
        onClick={onClick}
      >
        <span className="text-primary mr-2">{'>'}</span>
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
        className="group flex items-center rounded-xl glass-nav-pattern px-4 py-2.5 text-sm font-mono text-foreground transition hover:bg-muted/30 pointer-events-auto relative z-10"
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
              className="fixed inset-x-4 top-8 z-50 origin-top rounded-2xl glass-nav-pattern p-8 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <div className="flex flex-row-reverse items-center justify-between">
                <button
                  type="button"
                  onClick={handleClose}
                  className="-m-1 p-1 hover:text-primary transition"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6 text-muted-foreground" />
                </button>
                <h2 className="text-sm font-mono text-muted-foreground">
                  <span className="text-primary">$</span> ./navigate
                </h2>
              </div>
              <nav className="mt-6">
                <ul className="-my-2 divide-y divide-border/50 text-base text-foreground">
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