import React, { useState } from 'react'
import { Head, Link } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import PublicLayout from '../../layouts/public-layout'
import { Container } from '../../components/Container'

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
    const [selectedImage, setSelectedImage] = useState<number | null>(null)

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
                            
                            <article>
                                <header className="flex flex-col">
                                    <motion.h1 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6 }}
                                        className="mt-6 text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl"
                                    >
                                        {photo?.title || 'Photography Gallery'}
                                    </motion.h1>
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.1 }}
                                        className="order-first flex items-center text-base text-zinc-400 dark:text-zinc-500"
                                    >
                                        <span className="h-4 w-0.5 rounded-full bg-zinc-200 dark:bg-zinc-500" />
                                        <div className="ml-3 flex items-center gap-4">
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
                                                    <span>•</span>
                                                    <span>{photo.image_count} images</span>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                    {photo?.description && (
                                        <motion.p 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: 0.2 }}
                                            className="mt-6 text-base text-zinc-600 dark:text-zinc-400"
                                        >
                                            {photo.description}
                                        </motion.p>
                                    )}
                                </header>
                                
                                <motion.div 
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                    className="mt-8"
                                >
                                    {photo?.images?.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                                            {photo.images.map((image, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 50 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ 
                                                        duration: 0.6, 
                                                        delay: 0.4 + (index * 0.1),
                                                        ease: "easeOut"
                                                    }}
                                                    whileHover={{ 
                                                        y: -8,
                                                        transition: { duration: 0.2 }
                                                    }}
                                                    className="group cursor-pointer"
                                                    onClick={() => setSelectedImage(index)}
                                                >
                                                    <div className="relative overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 shadow-lg">
                                                        <div className="aspect-[4/5] overflow-hidden">
                                                            <motion.img
                                                                src={image.card_url}
                                                                alt={image.alt}
                                                                className="h-full w-full object-cover"
                                                                whileHover={{ scale: 1.05 }}
                                                                transition={{ duration: 0.4 }}
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                        <motion.div 
                                                            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                            initial={{ opacity: 0 }}
                                                            whileHover={{ opacity: 1 }}
                                                        >
                                                            <div className="absolute bottom-4 left-4 right-4">
                                                                <p className="text-white font-medium text-sm">
                                                                    Image {index + 1}
                                                                </p>
                                                                <p className="text-white/80 text-xs">
                                                                    Click to view full size
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
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
                                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
                                onClick={() => setSelectedImage(null)}
                            >
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    className="relative max-w-7xl max-h-[90vh] mx-4"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <img
                                        src={photo.images[selectedImage].full_url}
                                        alt={photo.images[selectedImage].alt}
                                        className="max-w-full max-h-full object-contain rounded-lg"
                                    />
                                    
                                    {/* Close button */}
                                    <button
                                        onClick={() => setSelectedImage(null)}
                                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700/80 transition-colors flex items-center justify-center"
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
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700/80 transition-colors flex items-center justify-center text-2xl"
                                            >
                                                ‹
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                        setSelectedImage(selectedImage < photo.images.length - 1 ? selectedImage + 1 : 0);
                                                }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700/80 transition-colors flex items-center justify-center text-2xl"
                                            >
                                                ›
                                            </button>
                                        </>
                                    )}
                                    
                                    {/* Image counter */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-zinc-800/80 text-white text-sm">
                                        {selectedImage + 1} / {photo.images.length}
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