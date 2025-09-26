import React from 'react';
import { Head } from '@inertiajs/react';
import PublicLayout from '../../layouts/public-layout';
import { ArticleLayout } from '../../components/ArticleLayout';
// Ensure custom code block styles are available on article pages
import '@shared/components/tiptap/tiptap-node/code-block-node/code-block-node.scss'

interface ArticleProps {
    article: {
        title: string;
        description: string;
        date: string;
        content: string;
        author?: string;
    };
}

export default function ArticleShow({ article }: ArticleProps) {
    return (
        <>
            <Head title={article.title} />
            <PublicLayout>
                <ArticleLayout article={article}>
                    <div 
                        className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-a:text-teal-500 hover:prose-a:text-teal-600 dark:prose-a:text-teal-400 dark:hover:prose-a:text-teal-300 prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-code:text-zinc-800 dark:prose-code:text-zinc-200 prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:bg-zinc-900 dark:prose-pre:bg-zinc-800 prose-blockquote:border-l-teal-500 prose-img:rounded-lg prose-hr:border-zinc-200 dark:prose-hr:border-zinc-700"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                </ArticleLayout>
            </PublicLayout>
        </>
    );
}