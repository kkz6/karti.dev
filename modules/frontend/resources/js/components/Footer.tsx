import { Link } from '@inertiajs/react'
import { Container } from './Container'

const navigation = [
  { name: 'About', href: '/about' },
  { name: 'Consulting', href: '/consulting' },
  { name: 'Articles', href: '/articles' },
  { name: 'Projects', href: '/projects' },
  { name: 'Speaking', href: '/speaking' },
  { name: 'Photography', href: '/photography' },
  { name: 'Uses', href: '/uses' },
]

const social = [
  { name: 'X', href: 'https://x.com/ikkarti' },
  { name: 'GitHub', href: 'https://github.com/kkz6' },
  { name: 'LinkedIn', href: 'https://linkedin.com/in/ikkarti' },
  { name: 'Email', href: 'mailto:karthick@gigcodes.com' },
]

export function Footer() {
  return (
    <footer className="mt-32">
      <Container.Outer>
        <div className="border-t border-border/70 py-12">
          <Container.Inner>
            <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
              <div className="max-w-xs">
                <p className="font-display text-base font-semibold tracking-[-0.015em] text-foreground">
                  Karthick
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Developer and founder in Bangalore. Software, home automation, networks &mdash; and a spare room on Airbnb.
                </p>
              </div>

              <div className="flex gap-16 sm:gap-20">
                <nav aria-label="Footer">
                  <p className="label-mono mb-4">pages</p>
                  <ul className="space-y-2.5">
                    {navigation.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                <div>
                  <p className="label-mono mb-4">elsewhere</p>
                  <ul className="space-y-2.5">
                    {social.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                        >
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <p className="mt-12 border-t border-border/50 pt-8 font-mono text-xs text-muted-foreground">
              <span className="text-primary">&copy;</span> {new Date().getFullYear()} Karthick. All rights reserved.
            </p>
          </Container.Inner>
        </div>
      </Container.Outer>
    </footer>
  )
}
