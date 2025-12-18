import { Head, Link } from '@inertiajs/react'
import PublicLayout from '../layouts/public-layout'
import { Container } from '../components/Container'
import clsx from 'clsx'

interface Photo {
    slug: string
    title: string
    description: string
    date: string | null
    coverImage: string
    imageCount: number
    categories: string[]
    location?: string
}

interface FeaturedPhoto {
    src: string;
    alt: string;
}

interface PhotographyProps {
    photos?: Photo[];
    featuredPhotos?: FeaturedPhoto[];
}

function MapPinIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    )
}

function CameraIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    )
}

function TravelCard({ photo, featured = false }: { photo: Photo; featured?: boolean }) {
    return (
        <Link
            href={`/photography/${photo.slug}`}
            className={clsx(
                'travel-card group block',
                featured ? 'aspect-[4/3] sm:aspect-[16/10]' : 'aspect-[4/3]'
            )}
        >
            <img
                src={photo.coverImage}
                alt={photo.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
            />
            <div className="travel-card-overlay" />
            <div className="travel-card-content">
                {photo.location && (
                    <div className="location-tag mb-3">
                        <MapPinIcon className="h-3 w-3" />
                        <span>{photo.location}</span>
                    </div>
                )}
                <h3 className={clsx(
                    'font-display font-medium text-white',
                    featured ? 'text-xl sm:text-2xl' : 'text-lg'
                )}>
                    {photo.title}
                </h3>
                <p className="mt-2 text-sm text-white/80 line-clamp-2 font-mono">
                    {photo.description}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-white/70 font-mono">
                    <span className="flex items-center gap-1">
                        <CameraIcon className="h-3.5 w-3.5" />
                        {photo.imageCount} shots
                    </span>
                    {photo.date && (
                        <span>
                            {new Date(photo.date).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                            })}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}

function EmptyState() {
    return (
        <div className="terminal-window">
            <div className="terminal-window-header">
                <div className="terminal-window-dot red" />
                <div className="terminal-window-dot yellow" />
                <div className="terminal-window-dot green" />
                <span className="ml-3 text-xs font-mono text-muted-foreground">~/gallery</span>
            </div>
            <div className="p-8 text-center">
                <CameraIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-display text-lg text-foreground">
                    No collections yet
                </h3>
                <p className="mt-2 font-mono text-sm text-muted-foreground">
                    <span className="text-primary">$</span> loading gallery...
                </p>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                    Check back soon for new photographs.
                </p>
            </div>
        </div>
    )
}

export default function Photography({ photos = [] }: PhotographyProps) {
    const featuredPhotos = photos.slice(0, 2)
    const remainingPhotos = photos.slice(2)

    return (
        <>
            <Head title="Photography" />
            <PublicLayout>
                <Container className="mt-16 sm:mt-32">
                    <header className="max-w-2xl">
                        <div className="font-mono text-sm text-muted-foreground mb-4">
                            <span className="text-primary">~</span> ./gallery --view
                        </div>
                        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-foreground">
                            <span className="text-primary">{'{'}</span> Photography <span className="text-primary">{'}'}</span>
                        </h1>
                        <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                            A visual journal capturing moments through my lens. From landscapes to street scenes,
                            each collection tells its own story—freezing time in frames that speak louder than words.
                        </p>
                    </header>
                </Container>

                <Container className="mt-16 sm:mt-20">
                    {photos.length > 0 ? (
                        <div className="space-y-8">
                            {/* Featured section - first 2 photos in larger cards */}
                            {featuredPhotos.length > 0 && (
                                <div className="grid gap-6 sm:grid-cols-2">
                                    {featuredPhotos.map((photo) => (
                                        <TravelCard
                                            key={photo.slug}
                                            photo={photo}
                                            featured
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Remaining photos in a grid */}
                            {remainingPhotos.length > 0 && (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {remainingPhotos.map((photo) => (
                                        <TravelCard
                                            key={photo.slug}
                                            photo={photo}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <EmptyState />
                    )}
                </Container>

                {/* Travel stats section */}
                {photos.length > 0 && (
                    <Container className="mt-20">
                        <div className="glass-card rounded-xl p-6 sm:p-8">
                            <div className="font-mono text-sm text-muted-foreground mb-4">
                                <span className="text-primary">$</span> cat stats.json
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                <div>
                                    <div className="font-display text-2xl sm:text-3xl font-medium text-primary">
                                        {photos.length}
                                    </div>
                                    <div className="font-mono text-sm text-muted-foreground">
                                        collections
                                    </div>
                                </div>
                                <div>
                                    <div className="font-display text-2xl sm:text-3xl font-medium text-primary">
                                        {photos.reduce((acc, p) => acc + p.imageCount, 0)}
                                    </div>
                                    <div className="font-mono text-sm text-muted-foreground">
                                        photographs
                                    </div>
                                </div>
                                <div>
                                    <div className="font-display text-2xl sm:text-3xl font-medium text-primary">
                                        {new Set(photos.flatMap(p => p.categories)).size}
                                    </div>
                                    <div className="font-mono text-sm text-muted-foreground">
                                        categories
                                    </div>
                                </div>
                                <div>
                                    <div className="font-display text-2xl sm:text-3xl font-medium text-primary">
                                        {photos.filter(p => p.location).length}
                                    </div>
                                    <div className="font-mono text-sm text-muted-foreground">
                                        destinations
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Container>
                )}
            </PublicLayout>
        </>
    )
}
