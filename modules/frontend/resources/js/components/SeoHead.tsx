import { Head } from '@inertiajs/react';

export interface SeoData {
    title?: string;
    description?: string;
    author?: string;
    image?: string;
    url?: string;
    type?: string;
    site_name?: string;
    twitter_card?: string;
    twitter_site?: string;
    twitter_creator?: string;
    robots?: string;
    locale?: string;
}

interface SeoHeadProps {
    seo?: SeoData;
    jsonLd?: Record<string, unknown>;
}

export function SeoHead({ seo, jsonLd }: SeoHeadProps) {
    if (!seo) {
        return <Head title="Home" />;
    }

    return (
        <Head>
            <title>{seo.title}</title>

            {seo.description && <meta name="description" content={seo.description} />}
            {seo.author && <meta name="author" content={seo.author} />}
            {seo.robots && <meta name="robots" content={seo.robots} />}

            {/* Open Graph */}
            {seo.title && <meta property="og:title" content={seo.title} />}
            {seo.description && <meta property="og:description" content={seo.description} />}
            {seo.image && <meta property="og:image" content={seo.image} />}
            {seo.url && <meta property="og:url" content={seo.url} />}
            {seo.type && <meta property="og:type" content={seo.type} />}
            {seo.site_name && <meta property="og:site_name" content={seo.site_name} />}
            {seo.locale && <meta property="og:locale" content={seo.locale} />}

            {/* Twitter Card */}
            {seo.twitter_card && <meta name="twitter:card" content={seo.twitter_card} />}
            {seo.title && <meta name="twitter:title" content={seo.title} />}
            {seo.description && <meta name="twitter:description" content={seo.description} />}
            {seo.image && <meta name="twitter:image" content={seo.image} />}
            {seo.twitter_site && <meta name="twitter:site" content={seo.twitter_site} />}
            {seo.twitter_creator && <meta name="twitter:creator" content={seo.twitter_creator} />}

            {/* Canonical URL */}
            {seo.url && <link rel="canonical" href={seo.url} />}

            {/* JSON-LD Structured Data */}
            {jsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            )}
        </Head>
    );
}
