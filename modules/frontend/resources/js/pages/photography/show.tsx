import React, { useRef, useState } from 'react'
import { Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import PublicLayout from '../../layouts/public-layout'
import { Container } from '../../components/Container'
import { SeoHead, SeoData } from '../../components/SeoHead'
import { GalleryLightbox } from '../../components/GalleryLightbox'

interface PhotographyShowProps {
    photo: {
        slug: string
        title: string
        description: string
        date: string | null
        categories: { id: number; name: string; slug: string }[]
        cover_image: string
        images: Array<{
            card_url: string
            full_url: string
            alt: string
        }>
        image_count: number
        location?: string
    }
    seo?: SeoData
    jsonLd?: Record<string, unknown>
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

export default function PhotographyShow({ photo, seo, jsonLd }: PhotographyShowProps) {
    const [selectedImage, setSelectedImage] = useState<number | null>(null)
    const galleryTrigger = useRef<HTMLButtonElement>(null)

    return (
        <>
            <SeoHead seo={seo} jsonLd={jsonLd} />
            <PublicLayout>
                <Container className="mt-16 lg:mt-32">
                    <div className="xl:relative">
                        <div className="mx-auto max-w-4xl">
                            <Link
                                href="/photography"
                                aria-label="Go back to photography"
                                className="group mb-8 flex h-10 w-10 items-center justify-center rounded-xl glass-card transition hover:border-primary/30 lg:absolute lg:-left-5 lg:-mt-2 lg:mb-0 xl:-top-1.5 xl:left-0 xl:mt-0"
                            >
                                <ArrowLeftIcon className="h-4 w-4 stroke-muted-foreground transition group-hover:stroke-primary" />
                            </Link>

                            <article>
                                <header className="flex flex-col">
                                    <div className="font-mono text-sm text-muted-foreground mb-4">
                                        <span className="text-primary">~</span> ./photography/<span className="text-primary">{photo?.slug || 'gallery'}</span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-muted-foreground mb-4">
                                        <span className="h-4 w-0.5 rounded-full bg-primary/50" />
                                        {photo?.date && (
                                            <time dateTime={photo.date}>
                                                {new Date(photo.date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </time>
                                        )}
                                        {photo?.image_count && (
                                            <>
                                                <span className="text-border">|</span>
                                                <span className="flex items-center gap-1">
                                                    <CameraIcon className="h-3.5 w-3.5" />
                                                    {photo.image_count} shots
                                                </span>
                                            </>
                                        )}
                                        {photo?.location && (
                                            <>
                                                <span className="text-border">|</span>
                                                <span className="flex items-center gap-1">
                                                    <MapPinIcon className="h-3.5 w-3.5" />
                                                    {photo.location}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    <motion.h1
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6 }}
                                        className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-foreground"
                                    >
                                        {photo?.title || 'Photography Gallery'}
                                    </motion.h1>

                                    {photo?.description && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: 0.1 }}
                                            className="mt-6 text-base leading-relaxed text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: photo.description }}
                                        />
                                    )}
                                </header>

                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    className="mt-12"
                                >
                                    {photo?.images?.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                            {photo.images.map((image, index) => (
                                                <motion.button
                                                    type="button"
                                                    key={index}
                                                    initial={{ opacity: 0, y: 50 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{
                                                        duration: 0.5,
                                                        delay: 0.3 + (index * 0.05),
                                                        ease: "easeOut"
                                                    }}
                                                    className="group cursor-zoom-in rounded-2xl text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                                                    aria-label={`Open photo ${index + 1}: ${image.alt || photo.title}`}
                                                    onClick={(event) => {
                                                        galleryTrigger.current = event.currentTarget
                                                        setSelectedImage(index)
                                                    }}
                                                >
                                                    <div className="travel-card overflow-hidden">
                                                        <div className="aspect-[4/5] overflow-hidden">
                                                            <img
                                                                src={image.card_url}
                                                                alt={image.alt}
                                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                            <div className="absolute bottom-4 left-4 right-4">
                                                                <p className="text-white font-mono text-sm">
                                                                    <span className="text-primary/80">{'>'}</span> Image {index + 1}
                                                                </p>
                                                                <p className="text-white/70 font-mono text-xs mt-1">
                                                                    Click to expand
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    ) : (
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
                                                    No images in this gallery
                                                </h3>
                                                <p className="mt-2 font-mono text-sm text-muted-foreground">
                                                    <span className="text-primary">$</span> ls images/
                                                </p>
                                                <p className="font-mono text-sm text-muted-foreground">
                                                    (empty)
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </article>
                        </div>
                    </div>

                    <GalleryLightbox
                        title={photo.title}
                        images={photo.images}
                        index={selectedImage}
                        onIndexChange={setSelectedImage}
                        onClose={() => setSelectedImage(null)}
                        returnFocusRef={galleryTrigger}
                    />
                </Container>
            </PublicLayout>
        </>
    )
}
