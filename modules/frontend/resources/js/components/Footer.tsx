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
    <footer className="mt-32">
      <Container.Outer>
        <div className="border-t border-border py-10">
          <Container.Inner>
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-sm text-muted-foreground">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="transition hover:text-primary"
                  >
                    ./{item.name.toLowerCase()}
                  </Link>
                ))}
              </div>
              <p className="font-mono text-sm text-muted-foreground">
                <span className="text-primary">$</span> echo &copy; {new Date().getFullYear()} karthick
              </p>
            </div>
          </Container.Inner>
        </div>
      </Container.Outer>
    </footer>
  )
}