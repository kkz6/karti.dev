import { Link } from '@inertiajs/react'
import { Container } from './Container'

const navigation = [
  { name: 'About', href: '/about' },
  { name: 'Articles', href: '/articles' },
  { name: 'Projects', href: '/projects' },
  { name: 'Speaking', href: '/speaking' },
  { name: 'Photography', href: '/photography' },
  { name: 'Uses', href: '/uses' },
]

export function Footer() {
  return (
    <footer className="mt-24">
      <Container.Outer>
        <div className="py-6">
          <Container.Inner>
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="transition hover:text-teal-500 dark:hover:text-teal-400"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                &copy; {new Date().getFullYear()} All rights reserved.
              </p>
            </div>
          </Container.Inner>
        </div>
      </Container.Outer>
    </footer>
  )
}