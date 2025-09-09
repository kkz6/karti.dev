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
    photo: {
        slug: string
        title: string
        description: string
        date: string | null
        categories: any[]
        cover_image: string
        image_ids: string[]
        image_count: number
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

export default function PhotographyShow({ photo }: PhotographyShowProps) {
    // Convert image_ids to photo objects
    const photos = photo?.image_ids?.length > 0 
        ? photo.image_ids.map((id, index) => ({
            src: `/storage/images/${id}`, // Adjust path as needed
            alt: `${photo.title} - Image ${index + 1}`
          }))
        : []

    return (
        <>
            <Head title={photo?.title || 'Photography Gallery'} />
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
                                    {photo?.title || 'Photography Gallery'}
                                </h1>
                                <div className="order-first flex items-center gap-3 text-base text-zinc-400 dark:text-zinc-500">
                                    {photo?.date && (
                                        <time dateTime={photo.date}>
                                            {new Date(photo.date).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </time>
                                    )}
                                    {photo?.categories && photo.categories.length > 0 && (
                                        <>
                                            <span className="h-4 w-0.5 rounded-full bg-zinc-200 dark:bg-zinc-500" />
                                            <span>{photo.categories.map(cat => cat.name).join(', ')}</span>
                                        </>
                                    )}
                                    {photo?.image_count && (
                                        <>
                                            <span className="h-4 w-0.5 rounded-full bg-zinc-200 dark:bg-zinc-500" />
                                            <span>{photo.image_count} images</span>
                                        </>
                                    )}
                                </div>
                                {photo?.description && (
                                    <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
                                        {photo.description}
                                    </p>
                                )}
                            </header>
                        </div>
                    </div>
                    
                    <div className="mt-16 sm:mt-20">
                        {photos.length > 0 ? (
                            <>
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
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                                    No images in this gallery
                                </h3>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                    This gallery doesn't contain any images yet.
                                </p>
                            </div>
                        )}
                    </div>
                </Container>
            </PublicLayout>
        </>
    )
}