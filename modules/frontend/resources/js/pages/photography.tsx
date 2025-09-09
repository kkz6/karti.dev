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
        <Card as="article">
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
        </Card>
    )
}

export default function Photography({ photos = [], featuredPhotos = [] }: PhotographyProps) {
    // Default featured photos if none provided
    const defaultFeaturedPhotos = [
        { src: '/images/photos/image-1.jpg', alt: 'Featured photo 1' },
        { src: '/images/photos/image-2.jpg', alt: 'Featured photo 2' },
        { src: '/images/photos/image-3.jpg', alt: 'Featured photo 3' },
        { src: '/images/photos/image-4.jpg', alt: 'Featured photo 4' },
        { src: '/images/photos/image-5.jpg', alt: 'Featured photo 5' },
    ];

    const photosToShow = featuredPhotos.length > 0 ? featuredPhotos : defaultFeaturedPhotos;

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
                
                {/* Featured images section - full width for overflow effect */}
                <div className="mt-16 sm:mt-20">
                    <div className="-my-4 flex justify-center gap-5 overflow-hidden py-4 sm:gap-8">
                        {photosToShow.map((photo, photoIndex) => (
                            <div
                                key={photo.src}
                                className={clsx(
                                    'relative aspect-[9/10] w-44 flex-none overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 sm:w-72 sm:rounded-2xl',
                                    photoIndex % 2 === 0 ? 'rotate-2' : '-rotate-2'
                                )}
                            >
                                <img
                                    src={photo.src}
                                    alt={photo.alt}
                                    sizes="(min-width: 640px) 18rem, 11rem"
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                
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