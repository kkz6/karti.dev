import { Link } from '@inertiajs/react'
import clsx from 'clsx'

function ChevronRightIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6.75 5.75 9.25 8l-2.5 2.25"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function isExternalUrl(href?: string): boolean {
  if (!href) return false
  return (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')
  )
}

export function Card<T extends React.ElementType = 'div'>({
  as,
  className,
  children,
  href,
}: Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'href'> & {
  as?: T
  className?: string
  href?: string
}) {
  const Component = as ?? 'div'

  return (
    <Component
      className={clsx(className, 'group surface-card relative flex flex-col items-start')}
    >
      {href &&
        (isExternalUrl(href) ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 z-20"
            aria-hidden="true"
          />
        ) : (
          <Link
            href={href}
            className="absolute inset-0 z-20"
            aria-hidden="true"
          />
        ))}
      {children}
    </Component>
  )
}

Card.Link = function CardLink({
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link> & { href: string }) {
  if (isExternalUrl(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center hover:text-primary transition-colors"
      >
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className="group inline-flex items-center hover:text-primary transition-colors" {...props}>
      {children}
    </Link>
  )
}

Card.Title = function CardTitle<T extends React.ElementType = 'h2'>({
  as,
  href,
  children,
}: Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'href'> & {
  as?: T
  href?: string
}) {
  const Component = as ?? 'h2'

  return (
    <Component className="font-display text-lg font-semibold tracking-[-0.015em] text-foreground transition-colors duration-200 group-hover:text-primary">
      {href ? <Card.Link href={href}>{children}</Card.Link> : children}
    </Component>
  )
}

Card.Description = function CardDescription({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <p className="prose-measure relative z-10 mt-2.5 text-[0.9375rem] leading-relaxed text-muted-foreground">
      {children}
    </p>
  )
}

Card.Cta = function CardCta({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="relative z-10 mt-5 flex items-center font-mono text-sm text-primary transition-colors"
    >
      {children}
      <ChevronRightIcon className="ml-1 h-4 w-4 stroke-current transition-transform duration-300 ease-out group-hover:translate-x-1" />
    </div>
  )
}

Card.Eyebrow = function CardEyebrow<T extends React.ElementType = 'p'>({
  as,
  decorate = false,
  className,
  children,
  ...props
}: Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'decorate'> & {
  as?: T
  decorate?: boolean
}) {
  const Component = as ?? 'p'

  return (
    <Component
      className={clsx(
        className,
        'relative z-10 order-first mb-3 flex items-center font-mono text-xs tracking-[0.06em] text-muted-foreground',
        decorate && 'pl-3.5',
      )}
      {...props}
    >
      {decorate && (
        <span
          className="absolute inset-y-0 left-0 flex items-center"
          aria-hidden="true"
        >
          <span className="h-4 w-0.5 rounded-full bg-primary/50" />
        </span>
      )}
      {children}
    </Component>
  )
}