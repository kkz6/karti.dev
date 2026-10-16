export function getPublicationStatus(status: string | undefined, publishedAt?: Date | null, now = Date.now()): string | undefined {
    return status === 'published' && publishedAt && publishedAt.getTime() > now ? 'scheduled' : status;
}
