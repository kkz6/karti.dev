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
      className={clsx(className, 'group relative flex flex-col items-start')}
    >
      {href && (
        <Link
          href={href}
          className="absolute inset-0 z-20"
          aria-hidden="true"
        />
      )}
      {children}
    </Component>
  )
}

Card.Link = function CardLink({
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link> & { href: string }) {
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
    <Component className="text-base font-display font-medium tracking-tight text-foreground">
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
    <p className="relative z-10 mt-2 text-sm text-muted-foreground leading-relaxed">
      {children}
    </p>
  )
}

Card.Cta = function CardCta({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="relative z-10 mt-4 flex items-center text-sm font-mono text-primary group-hover:text-primary/80 transition-colors"
    >
      <span className="mr-1 select-none">{'>'}</span>
      {children}
      <ChevronRightIcon className="ml-1 h-4 w-4 stroke-current transition-transform group-hover:translate-x-1" />
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
        'relative z-10 order-first mb-3 flex items-center text-sm font-mono text-muted-foreground',
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