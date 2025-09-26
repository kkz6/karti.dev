import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import { useEffect, useRef } from 'react';

// Core + common
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-python';

// Ordered dependencies for TSX
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-typescript';

interface ArticleContentProps {
    content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!contentRef.current || !content) return;

        // Inject HTML
        contentRef.current.innerHTML = content;

        // Highlight all code
        Prism.highlightAllUnder(contentRef.current);

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

    return <div ref={contentRef} className="article-content prose prose-zinc dark:prose-invert max-w-none" />;
}
