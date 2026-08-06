import { useId } from 'react'

export function Section({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  const id = useId()

  return (
    <section aria-labelledby={title ? id : undefined}>
      <div className="grid grid-cols-1 items-baseline gap-y-8 md:grid-cols-4 md:gap-x-10">
        {title && (
          <>
            <h2
              id={id}
              className="label-mono md:sticky md:top-28 md:self-start"
            >
              {title}
            </h2>
            <div className="md:col-span-3 md:border-l md:border-border/60 md:pl-10">
              {children}
            </div>
          </>
        )}
        {!title && <div className="md:col-span-4">{children}</div>}
      </div>
    </section>
  )
}
