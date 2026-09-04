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

            {seo.description && <meta head-key="description" name="description" content={seo.description} />}
            {seo.author && <meta head-key="author" name="author" content={seo.author} />}
            {seo.robots && <meta head-key="robots" name="robots" content={seo.robots} />}

            {/* Open Graph */}
            {seo.title && <meta head-key="og:title" property="og:title" content={seo.title} />}
            {seo.description && <meta head-key="og:description" property="og:description" content={seo.description} />}
            {seo.image && <meta head-key="og:image" property="og:image" content={seo.image} />}
            {seo.url && <meta head-key="og:url" property="og:url" content={seo.url} />}
            {seo.type && <meta head-key="og:type" property="og:type" content={seo.type} />}
            {seo.site_name && <meta head-key="og:site_name" property="og:site_name" content={seo.site_name} />}
            {seo.locale && <meta head-key="og:locale" property="og:locale" content={seo.locale} />}

            {/* Twitter Card */}
            {seo.twitter_card && <meta head-key="twitter:card" name="twitter:card" content={seo.twitter_card} />}
            {seo.title && <meta head-key="twitter:title" name="twitter:title" content={seo.title} />}
            {seo.description && <meta head-key="twitter:description" name="twitter:description" content={seo.description} />}
            {seo.image && <meta head-key="twitter:image" name="twitter:image" content={seo.image} />}
            {seo.twitter_site && <meta head-key="twitter:site" name="twitter:site" content={seo.twitter_site} />}
            {seo.twitter_creator && <meta head-key="twitter:creator" name="twitter:creator" content={seo.twitter_creator} />}

            {/* Canonical URL */}
            {seo.url && <link head-key="canonical" rel="canonical" href={seo.url} />}

            {/* JSON-LD Structured Data */}
            {jsonLd && (
                <script
                    head-key="json-ld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(jsonLd).replace(/[<>&]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`),
                    }}
                />
            )}
        </Head>
    );
}
