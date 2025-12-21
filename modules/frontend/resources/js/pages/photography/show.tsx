import React, { useState } from 'react'
import { Link } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import PublicLayout from '../../layouts/public-layout'
import { Container } from '../../components/Container'
import { SeoHead, SeoData } from '../../components/SeoHead'

interface PhotographyShowProps {
    photo: {
        slug: string
        title: string
        description: string
        date: string | null
        categories: any[]
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
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 50 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{
                                                        duration: 0.5,
                                                        delay: 0.3 + (index * 0.05),
                                                        ease: "easeOut"
                                                    }}
                                                    className="group cursor-pointer"
                                                    onClick={() => setSelectedImage(index)}
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
                                                </motion.div>
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

                    {/* Lightbox Modal */}
                    <AnimatePresence>
                        {selectedImage !== null && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
                                onClick={() => setSelectedImage(null)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    className="relative max-w-7xl max-h-[90vh] mx-4"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <img
                                        src={photo.images[selectedImage].full_url}
                                        alt={photo.images[selectedImage].alt}
                                        className="max-w-full max-h-[85vh] object-contain rounded-lg"
                                    />

                                    {/* Close button */}
                                    <button
                                        onClick={() => setSelectedImage(null)}
                                        className="absolute top-4 right-4 w-10 h-10 rounded-xl glass-strong text-white hover:text-primary transition-colors flex items-center justify-center font-mono"
                                    >
                                        ×
                                    </button>

                                    {/* Navigation */}
                                    {photo.images.length > 1 && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedImage(selectedImage > 0 ? selectedImage - 1 : photo.images.length - 1);
                                                }}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl glass-strong text-white hover:text-primary transition-colors flex items-center justify-center font-mono text-2xl"
                                            >
                                                ‹
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedImage(selectedImage < photo.images.length - 1 ? selectedImage + 1 : 0);
                                                }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl glass-strong text-white hover:text-primary transition-colors flex items-center justify-center font-mono text-2xl"
                                            >
                                                ›
                                            </button>
                                        </>
                                    )}

                                    {/* Image counter */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl glass-strong text-white font-mono text-sm">
                                        <span className="text-primary">[</span>
                                        {selectedImage + 1} / {photo.images.length}
                                        <span className="text-primary">]</span>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Container>
            </PublicLayout>
        </>
    )
}
