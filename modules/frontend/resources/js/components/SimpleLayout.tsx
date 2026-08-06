import { Container } from './Container'

export function SimpleLayout({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string
  title: string
  intro?: string
  children?: React.ReactNode
}) {
  return (
    <Container className="mt-16 sm:mt-24">
      <header className="max-w-3xl">
        {eyebrow && (
          <p className="label-mono mb-5 flex items-center gap-2">
            <span aria-hidden="true" className="h-px w-6 bg-primary/50" />
            {eyebrow}
          </p>
        )}
        <h1 className="display-2 text-foreground">{title}</h1>
        {intro && (
          <p className="prose-measure mt-6 text-lg leading-relaxed text-muted-foreground">
            {intro}
          </p>
        )}
      </header>
      {children && <div className="mt-16 sm:mt-20">{children}</div>}
    </Container>
  )
}
