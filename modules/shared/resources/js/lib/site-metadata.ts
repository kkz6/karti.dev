/** Explicit page metadata wins over entry content, then site-wide defaults. */
export function resolveSeoPreview(
    site: { name: string; title: string; description: string; image: string },
    entry: { title?: string | null; description?: string | null; image?: string | null },
    seo: { title?: string | null; description?: string | null; image?: string | null },
) {
    return {
        title: seo.title?.trim() || entry.title?.trim() || site.title || site.name,
        description: seo.description?.trim() || entry.description?.trim() || site.description,
        image: seo.image || entry.image || site.image,
    };
}

export function formatDocumentTitle(title: string, siteName: string, hasSeo: boolean) {
    if (hasSeo || title === siteName || title.endsWith(` - ${siteName}`)) return title || siteName;
    return title ? `${title} - ${siteName}` : siteName;
}
