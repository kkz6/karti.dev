import { Container } from './Container'

export function SimpleLayout({
  title,
  intro,
  children,
}: {
  title: string
  intro?: string
  children?: React.ReactNode
}) {
  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
          {title}
        </h1>
        {intro && (
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            {intro}
          </p>
        )}
      </header>
      {children && <div className="mt-16 sm:mt-20">{children}</div>}
    </Container>
  )
}