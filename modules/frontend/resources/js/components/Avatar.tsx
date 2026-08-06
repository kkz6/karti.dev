import { Link } from '@inertiajs/react'
import clsx from 'clsx'

export function AvatarContainer({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={clsx(
        className,
        'h-10 w-10 rounded-full bg-card/80 p-0.5 shadow-md ring-1 ring-border/60 backdrop-blur transition-shadow duration-200 hover:ring-primary/30'
      )}
      {...props}
    />
  )
}

export function Avatar({
  large = false,
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<'img'>, 'src' | 'alt'> & {
  large?: boolean
}) {
  return (
    <Link
      href="/"
      aria-label="Home"
      className={clsx(className, 'pointer-events-auto')}
    >
      <img
        src="/images/avatar.png"
        alt="Karthick"
        sizes={large ? '5rem' : '2.25rem'}
        className={clsx(
          'rounded-full bg-muted object-cover ring-1 ring-border/60 transition-transform duration-300 ease-out hover:scale-[1.03]',
          large ? 'h-20 w-20 shadow-lg' : 'h-9 w-9'
        )}
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiMxMEI5ODEiLz4KPHBhdGggZD0iTTIwIDIyQzIzLjMxMzcgMjIgMjYgMTkuMzEzNyAyNiAxNkMyNiAxMi42ODYzIDIzLjMxMzcgMTAgMjAgMTBDMTYuNjg2MyAxMCAxNCAxMi42ODYzIDE0IDE2QzE0IDE5LjMxMzcgMTYuNjg2MyAyMiAyMCAyMlpNMjAgMzBDMTQuNDc3MiAzMCAxMCAyNS41MjI4IDEwIDIwQzEwIDE0LjQ3NzIgMTQuNDc3MiAxMCAyMCAxMEMyNS41MjI4IDEwIDMwIDE0LjQ3NzIgMzAgMjBDMzAgMjUuNTIyOCAyNS41MjI4IDMwIDIwIDMwWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+'
        }}
        {...props}
      />
    </Link>
  )
}