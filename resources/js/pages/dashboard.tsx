import { Head, Link } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import AppLayout from '@shared/layouts/app-layout';
import { Camera, FileText, FolderOpen, LayoutGrid, Search } from 'lucide-react';

export default function Dashboard() {
    const links = [
        { title: 'Articles', description: 'Write and manage your articles.', href: route('admin.blog.index'), icon: FileText },
        { title: 'Photography', description: 'Organize your galleries and photographs.', href: route('admin.photography.index'), icon: Camera },
        { title: 'Media Manager', description: 'Browse and upload assets.', href: route('media-manager'), icon: FolderOpen },
        { title: 'SEO', description: 'Local traffic and Google Analytics reports.', href: route('admin.seo.index'), icon: Search },
    ];
    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: route('dashboard') }]}>
            <Head title="Dashboard" />
            <div className="content-index space-y-6">
                <IndexHeader title="Dashboard" icon={LayoutGrid} />
                <p className="text-muted-foreground">Your workspace. Choose a section to get started.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                    {links.map(({ title, description, href, icon: Icon }) => (
                        <Link
                            key={title}
                            href={href}
                            className="bg-card hover:bg-accent focus-visible:outline-ring rounded-lg border p-5 transition-colors focus-visible:outline-2"
                        >
                            <Icon className="text-muted-foreground mb-3 size-5" aria-hidden="true" />
                            <h2 className="font-semibold">{title}</h2>
                            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
