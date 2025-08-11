import React from 'react'
import { Head, Link } from '@inertiajs/react'
import PublicLayout from '../../layouts/public-layout'
import { Container } from '../../components/Container'

interface Photo {
    src: string
    alt: string
    width?: number
    height?: number
}

interface PhotographyShowProps {
    collection: {
        slug: string
        title: string
        description: string
        date: string
        location?: string
        camera?: string
        photos: Photo[]
    }
}

function ArrowLeftIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
    return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
            <path
                d="M7.25 11.25 3.75 8m0 0 3.5-3.25M3.75 8h8.5"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

export default function PhotographyShow({ collection }: PhotographyShowProps) {
    // Default photos if none provided
    const defaultPhotos: Photo[] = [
        { src: '/images/photos/image-1.jpg', alt: 'Photo 1' },
        { src: '/images/photos/image-2.jpg', alt: 'Photo 2' },
        { src: '/images/photos/image-3.jpg', alt: 'Photo 3' },
        { src: '/images/photos/image-4.jpg', alt: 'Photo 4' },
        { src: '/images/photos/image-5.jpg', alt: 'Photo 5' },
    ]

    const photos = collection?.photos || defaultPhotos

    return (
        <>
            <Head title={collection?.title || 'Photography Collection'} />
            <PublicLayout>
                <Container className="mt-16 lg:mt-32">
                    <div className="xl:relative">
                        <div className="mx-auto max-w-2xl">
                            <Link
                                href="/photography"
                                aria-label="Go back to photography"
                                className="group mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 transition dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0 dark:ring-white/10 dark:hover:border-zinc-700 dark:hover:ring-white/20 lg:absolute lg:-left-5 lg:-mt-2 lg:mb-0 xl:-top-1.5 xl:left-0 xl:mt-0"
                            >
                                <ArrowLeftIcon className="h-4 w-4 stroke-zinc-500 transition group-hover:stroke-zinc-700 dark:stroke-zinc-500 dark:group-hover:stroke-zinc-400" />
                            </Link>
                            
                            <header className="flex flex-col">
                                <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
                                    {collection?.title || 'Photography Collection'}
                                </h1>
                                <div className="order-first flex items-center gap-3 text-base text-zinc-400 dark:text-zinc-500">
                                    <time dateTime={collection?.date}>
                                        {collection?.date && new Date(collection.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </time>
                                    {collection?.location && (
                                        <>
                                            <span className="h-4 w-0.5 rounded-full bg-zinc-200 dark:bg-zinc-500" />
                                            <span>{collection.location}</span>
                                        </>
                                    )}
                                    {collection?.camera && (
                                        <>
                                            <span className="h-4 w-0.5 rounded-full bg-zinc-200 dark:bg-zinc-500" />
                                            <span>{collection.camera}</span>
                                        </>
                                    )}
                                </div>
                                {collection?.description && (
                                    <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
                                        {collection.description}
                                    </p>
                                )}
                            </header>
                        </div>
                    </div>
                    
                    <div className="mt-16 sm:mt-20">
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {photos.map((photo, index) => (
                                <div
                                    key={index}
                                    className="group relative aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800"
                                >
                                    <img
                                        src={photo.src}
                                        alt={photo.alt}
                                        className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                    />
                                </div>
                            ))}
                        </div>
                        
                        {/* Full width images section for variety */}
                        <div className="mt-8 space-y-8">
                            {photos.slice(0, 2).map((photo, index) => (
                                <div
                                    key={`full-${index}`}
                                    className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800"
                                >
                                    <img
                                        src={photo.src}
                                        alt={photo.alt}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </Container>
            </PublicLayout>
        </>
    )
}