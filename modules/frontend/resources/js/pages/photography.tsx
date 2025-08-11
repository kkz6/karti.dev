import { Head, Link } from '@inertiajs/react'
import PublicLayout from '../layouts/public-layout'
import { Container } from '../components/Container'
import { Card } from '../components/Card'
import clsx from 'clsx'

interface PhotoCollection {
    slug: string
    title: string
    description: string
    date: string
    coverImage: string
    imageCount: number
}

interface PhotographyProps {
    collections?: PhotoCollection[]
}

function PhotoCollectionCard({ collection }: { collection: PhotoCollection }) {
    return (
        <Card as="article">
            <Card.Title href={`/photography/${collection.slug}`}>
                {collection.title}
            </Card.Title>
            <Card.Eyebrow as="time" dateTime={collection.date} decorate>
                {new Date(collection.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                })}
            </Card.Eyebrow>
            <Card.Description>{collection.description}</Card.Description>
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {collection.imageCount} photos
            </div>
            <Card.Cta>View collection</Card.Cta>
        </Card>
    )
}

export default function Photography({ collections = [] }: PhotographyProps) {
    // Default collections for demo
    const defaultCollections: PhotoCollection[] = [
        {
            slug: 'street-photography',
            title: 'Street Photography',
            description: 'Capturing the raw energy and authentic moments of urban life across different cities.',
            date: '2024-03-15',
            coverImage: '/images/photos/image-1.jpg',
            imageCount: 24
        },
        {
            slug: 'landscapes',
            title: 'Landscapes & Nature',
            description: 'Exploring the breathtaking beauty of natural landscapes from mountains to coastlines.',
            date: '2024-02-20',
            coverImage: '/images/photos/image-2.jpg',
            imageCount: 32
        },
        {
            slug: 'portraits',
            title: 'Portraits',
            description: 'Intimate portraits that capture the essence and stories of interesting people.',
            date: '2024-01-10',
            coverImage: '/images/photos/image-3.jpg',
            imageCount: 18
        },
        {
            slug: 'architecture',
            title: 'Architecture',
            description: 'Geometric patterns and striking structures from modern and classical architecture.',
            date: '2023-12-05',
            coverImage: '/images/photos/image-4.jpg',
            imageCount: 28
        },
        {
            slug: 'travel',
            title: 'Travel Stories',
            description: 'Visual narratives from journeys across continents, cultures, and communities.',
            date: '2023-11-15',
            coverImage: '/images/photos/image-5.jpg',
            imageCount: 45
        }
    ]

    const collectionsToShow = collections.length > 0 ? collections : defaultCollections

    // Featured photos for the top section
    const featuredPhotos = [
        { src: '/images/photos/image-1.jpg', alt: 'Featured photo 1' },
        { src: '/images/photos/image-2.jpg', alt: 'Featured photo 2' },
        { src: '/images/photos/image-3.jpg', alt: 'Featured photo 3' },
        { src: '/images/photos/image-4.jpg', alt: 'Featured photo 4' },
        { src: '/images/photos/image-5.jpg', alt: 'Featured photo 5' },
    ]

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
                        {featuredPhotos.map((photo, photoIndex) => (
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
                
                {/* Collections section */}
                <Container className="mt-16 sm:mt-20">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 mb-8">
                        Photography Collections
                    </h2>
                    <div className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
                        <div className="flex max-w-3xl flex-col space-y-16">
                            {collectionsToShow.map((collection) => (
                                <PhotoCollectionCard 
                                    key={collection.slug} 
                                    collection={collection} 
                                />
                            ))}
                        </div>
                    </div>
                </Container>
            </PublicLayout>
        </>
    )
}