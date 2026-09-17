import { Dialog, DialogContent, DialogTitle } from '@shared/components/ui/dialog';
import Prism from '@shared/lib/prism-config';
import { useEffect, useRef, useState } from 'react';

interface ArticleContentProps {
    content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null);

    useEffect(() => {
        if (!contentRef.current || !content) return;

        // Inject HTML
        contentRef.current.innerHTML = content;

        // Highlight all code
        Prism.highlightAllUnder(contentRef.current);

        contentRef.current.querySelectorAll<HTMLImageElement>('img[data-full-src]').forEach((image) => {
            // Keep author-supplied links intact; otherwise make the image keyboard-accessible.
            if (image.closest('a')) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'block w-full cursor-zoom-in';
            button.setAttribute('aria-label', `Open full-size image: ${image.alt || 'Article image'}`);
            button.onclick = () => setPreview({ src: image.dataset.fullSrc!, alt: image.alt });
            image.replaceWith(button);
            button.appendChild(image);
        });

        // Add copy buttons
        const preBlocks = contentRef.current.querySelectorAll('pre');

        preBlocks.forEach((pre) => {
            // Prevent duplicate buttons
            if (pre.querySelector('.copy-btn')) return;

            const button = document.createElement('button');
            button.textContent = 'Copy';
            button.className = 'copy-btn absolute top-2 right-2 bg-zinc-700 text-white text-xs px-2 py-1 rounded hover:bg-zinc-600';

            button.onclick = () => {
                const code = pre.querySelector('code')?.textContent || '';
                if (!navigator.clipboard) {
                    // fallback method
                    const textarea = document.createElement('textarea');
                    textarea.value = code;
                    document.body.appendChild(textarea);
                    textarea.select();
                    try {
                        document.execCommand('copy');
                        button.textContent = 'Copied!';
                    } catch (err) {
                        console.error('Copy failed', err);
                    }
                    document.body.removeChild(textarea);
                    setTimeout(() => (button.textContent = 'Copy'), 2000);
                } else {
                    // modern method
                    navigator.clipboard.writeText(code).then(() => {
                        button.textContent = 'Copied!';
                        setTimeout(() => (button.textContent = 'Copy'), 2000);
                    });
                }
            };

            pre.style.position = 'relative'; // ensure positioning works
            pre.appendChild(button);
        });
    }, [content]);

    return (
        <>
            <div ref={contentRef} className="article-content prose prose-zinc dark:prose-invert max-w-none" />
            <Dialog
                open={preview !== null}
                onOpenChange={(open) => {
                    if (!open) setPreview(null);
                }}
            >
                <DialogContent className="sm:max-w-6xl" aria-describedby={undefined}>
                    <DialogTitle className="sr-only">{preview?.alt || 'Full-size image'}</DialogTitle>
                    {preview && <img src={preview.src} alt={preview.alt} className="max-h-[85dvh] w-full object-contain" />}
                </DialogContent>
            </Dialog>
        </>
    );
}
