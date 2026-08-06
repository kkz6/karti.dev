import { Link, usePage } from '@inertiajs/react'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { Container } from './Container'
import { MobileNavigation } from './MobileNavigation'
import { ThemeToggle } from './ThemeToggle'
import { Avatar, AvatarContainer } from './Avatar'

const navigation = [
  { name: 'About', href: '/about' },
  { name: 'Consulting', href: '/consulting' },
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
        aria-current={isActive ? 'page' : undefined}
        className={clsx(
          // Sans here rather than mono — mono labels made the bar unnecessarily wide
          'relative block rounded-full px-3 py-1.5 text-[0.8125rem] font-medium whitespace-nowrap transition-colors duration-200',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {/* Pill sits behind the label so the active state adds no layout shift */}
        {isActive && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-primary/10 ring-1 ring-primary/20"
          />
        )}
        <span className="relative">{children}</span>
      </Link>
    </li>
  )
}

function DesktopNavigation(props: React.ComponentPropsWithoutRef<'nav'>) {
  return (
    <nav aria-label="Main" {...props}>
      <ul className="surface-elevated flex items-center gap-0.5 rounded-full px-1.5 py-1">
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
  const frame = useRef<number | null>(null)
  const lastY = useRef(0)
  const [showNavAvatar, setShowNavAvatar] = useState(!isHomePage)
  const [avatarScale, setAvatarScale] = useState(1)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const SCROLL_THRESHOLD = 120

    function update() {
      const scrollY = window.scrollY

      // Retract the bar while scrolling down, bring it back on any upward move
      const delta = scrollY - lastY.current
      if (scrollY < 140 || delta < -4) {
        setHidden(false)
      } else if (delta > 6) {
        setHidden(true)
      }
      lastY.current = scrollY

      if (isHomePage) {
        setShowNavAvatar(scrollY > SCROLL_THRESHOLD * 0.6)
        setAvatarScale(clamp(1 - (scrollY / SCROLL_THRESHOLD) * 0.5, 0.5, 1))
      }

      frame.current = null
    }

    function handleScroll() {
      if (frame.current !== null) return
      frame.current = window.requestAnimationFrame(update)
    }

    if (!isHomePage) {
      setShowNavAvatar(true)
    }

    update()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frame.current !== null) window.cancelAnimationFrame(frame.current)
    }
  }, [isHomePage])

  return (
    <>
      <div
        ref={headerRef}
        className={clsx(
          'sticky top-0 z-40 py-4 transition-transform duration-500 ease-out will-change-transform',
          hidden ? '-translate-y-[140%]' : 'translate-y-0',
        )}
      >
        <Container>
          <div className="relative flex items-center justify-center">
            {/* Avatar — fades in on the home page once the hero portrait scrolls away */}
            <div className="absolute inset-y-0 left-0 flex items-center">
              <div
                className={clsx(
                  'transition-[opacity,transform] duration-300 ease-out',
                  showNavAvatar
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none -translate-y-1 opacity-0',
                )}
              >
                <AvatarContainer>
                  <Avatar />
                </AvatarContainer>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="block md:hidden">
                <MobileNavigation className="pointer-events-auto" />
              </div>
              <div className="hidden md:block">
                <DesktopNavigation className="pointer-events-auto" />
              </div>
            </div>

            <div className="absolute inset-y-0 right-0 flex items-center">
              <div className="pointer-events-auto">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Oversized portrait that anchors the top of the home page */}
      {isHomePage && (
        <div className="relative z-30">
          <Container className="pt-8">
            <div
              className="origin-top-left transition-[transform,opacity] duration-150 ease-out"
              style={{
                transform: `scale(${avatarScale})`,
                opacity: avatarScale < 0.62 ? 0 : 1,
              }}
            >
              <Avatar large className="block h-20 w-20" />
            </div>
          </Container>
        </div>
      )}
    </>
  )
}
