import { Head } from '@inertiajs/react'
import PublicLayout from '../layouts/public-layout';

interface BlogPostProps {
  slug: string
}

export default function BlogPost({ slug }: BlogPostProps) {
  return (
    <PublicLayout>
      <Head title="Blog Post" />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Blog Post: {slug}</h1>
        <p className="text-lg text-muted-foreground">Content for blog post with slug: {slug}</p>
      </div>
    </PublicLayout>
  )
}