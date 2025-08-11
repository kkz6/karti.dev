import React from 'react';
import { Head } from '@inertiajs/react';
import PublicLayout from '../../layouts/public-layout';
import { ArticleLayout } from '../../components/ArticleLayout';

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
                        className="prose-headings:font-semibold prose-h2:text-2xl prose-h3:text-xl prose-p:text-zinc-600 dark:prose-p:text-zinc-400"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                </ArticleLayout>
            </PublicLayout>
        </>
    );
}