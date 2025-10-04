import { Head, Link } from '@inertiajs/react'
import PublicLayout from '../layouts/public-layout'
import { Container } from '../components/Container'
import { Card } from '../components/Card'
import clsx from 'clsx'

interface Photo {
    slug: string
    title: string
    description: string
    date: string | null
    coverImage: string
    imageCount: number
    categories: string[]
}

interface FeaturedPhoto {
    src: string;
    alt: string;
}

interface PhotographyProps {
    photos?: Photo[];
    featuredPhotos?: FeaturedPhoto[];
}

function PhotoCard({ photo }: { photo: Photo }) {
    return (
        <Card as="article" href={`/photography/${photo.slug}`}>
            <div className="flex gap-6">
                {/* Cover Image */}
                <div className="relative z-10 flex-shrink-0">
                    <div className="relative overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 shadow-lg">
                        <div className="h-32 overflow-hidden">
                            <img
                                src={photo.coverImage}
                                alt={photo.title}
                                className="h-full w-auto object-cover transition-transform group-hover:scale-105"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                    <Card.Title href={`/photography/${photo.slug}`}>
                        {photo.title}
                    </Card.Title>
                    {photo.date && (
                        <Card.Eyebrow as="time" dateTime={photo.date} decorate>
                            {new Date(photo.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </Card.Eyebrow>
                    )}
                    <Card.Description>{photo.description}</Card.Description>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <span>{photo.imageCount} images</span>
                        {photo.categories.length > 0 && (
                            <>
                                <span>•</span>
                                <span>{photo.categories.join(', ')}</span>
                            </>
                        )}
                    </div>
                    <Card.Cta>View photos</Card.Cta>
                </div>
            </div>
        </Card>
    )
}

export default function Photography({ photos = []}: PhotographyProps) {
    return (
        <>
            <Head title="Photography" />
            <PublicLayout>
                <Container className="mt-16 sm:mt-32">
                    <header className="max-w-2xl">
                        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
                            Moments captured through my lens.
                        </h1>
                        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
                            Photography is my way of documenting the world around me. Each collection tells a different story, from the bustling streets of cities to the serene landscapes of nature.
                        </p>
                    </header>
                </Container>
                
                {/* Photo galleries section */}
                <Container className="mt-16 sm:mt-20">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 mb-8">
                        Photography Galleries
                    </h2>
                    <div className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
                        <div className="flex max-w-3xl flex-col space-y-16">
                            {photos.length > 0 ? (
                                photos.map((photo) => (
                                    <PhotoCard 
                                        key={photo.slug} 
                                        photo={photo} 
                                    />
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                                        No photography galleries yet
                                    </h3>
                                    <p className="text-zinc-600 dark:text-zinc-400">
                                        Check back soon for new photography content.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </Container>
            </PublicLayout>
        </>
    )
}