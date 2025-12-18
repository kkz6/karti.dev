import { Link, usePage } from '@inertiajs/react'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { Container } from './Container'
import { MobileNavigation } from './MobileNavigation'
import { ThemeToggle } from './ThemeToggle'
import { Avatar, AvatarContainer } from './Avatar'

const navigation = [
  { name: 'About', href: '/about' },
  { name: 'Articles', href: '/articles' },
  { name: 'Projects', href: '/projects' },
  { name: 'Speaking', href: '/speaking' },
  { name: 'Photography', href: '/photography' },
  { name: 'Uses', href: '/uses' },
]

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  const { url } = usePage()
  const isActive = url === href || url.startsWith(href + '/')

  return (
    <li>
      <Link
        href={href}
        className={clsx(
          'relative block px-3 py-1.5 transition-colors font-mono text-sm whitespace-nowrap',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-primary font-bold">{'>'}</span>
        )}
        <span className={isActive ? 'pl-2' : ''}>{children}</span>
      </Link>
    </li>
  )
}

function DesktopNavigation(props: React.ComponentPropsWithoutRef<'nav'>) {
  return (
    <nav {...props}>
      <ul className="flex items-center gap-1">
        {navigation.map((item) => (
          <NavItem key={item.href} href={item.href}>
            {item.name}
          </NavItem>
        ))}
      </ul>
    </nav>
  )
}

function clamp(number: number, a: number, b: number) {
  const min = Math.min(a, b)
  const max = Math.max(a, b)
  return Math.min(Math.max(number, min), max)
}

export function Header() {
  const { url } = usePage()
  const isHomePage = url === '/'

  const headerRef = useRef<HTMLDivElement>(null)
  const [showNavAvatar, setShowNavAvatar] = useState(false)
  const [avatarScale, setAvatarScale] = useState(1)

  useEffect(() => {
    if (!isHomePage) return

    const SCROLL_THRESHOLD = 100 // When to fully show avatar in nav

    function handleScroll() {
      const scrollY = window.scrollY

      // Show small avatar in nav when scrolled past threshold
      setShowNavAvatar(scrollY > SCROLL_THRESHOLD)

      // Calculate scale for the large avatar (1 -> 0.5 as we scroll)
      const scale = clamp(1 - (scrollY / SCROLL_THRESHOLD) * 0.5, 0.5, 1)
      setAvatarScale(scale)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isHomePage])

  return (
    <>
      {/* Sticky Navigation Bar */}
      <div
        ref={headerRef}
        className="sticky top-0 z-50 pt-4 pb-2 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-md"
      >
        <Container>
          <div className="relative flex gap-4 items-center">
            <div className="flex flex-1">
              {/* Show avatar in nav: always on non-home pages, or when scrolled on home page */}
              <div
                className={clsx(
                  'transition-all duration-300',
                  isHomePage
                    ? showNavAvatar
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 -translate-y-2 pointer-events-none'
                    : 'opacity-100'
                )}
              >
                <AvatarContainer>
                  <Avatar />
                </AvatarContainer>
              </div>
            </div>
            <div className="flex flex-1 justify-end md:justify-center">
              <div className="block md:hidden">
                <MobileNavigation className="pointer-events-auto" />
              </div>
              <div className="hidden md:block">
                <DesktopNavigation className="pointer-events-auto" />
              </div>
            </div>
            <div className="flex justify-end md:flex-1">
              <div className="pointer-events-auto">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Home Page Large Avatar Section */}
      {isHomePage && (
        <div className="relative z-40">
          <Container className="pt-6">
            <div
              className="transition-transform duration-100 origin-top-left"
              style={{
                transform: `scale(${avatarScale})`,
                opacity: avatarScale < 0.6 ? 0 : 1,
              }}
            >
              <Avatar
                large
                className="block h-16 w-16"
              />
            </div>
          </Container>
        </div>
      )}
    </>
  )
}