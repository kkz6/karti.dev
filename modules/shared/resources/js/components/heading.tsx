import { PageHeader } from './page-header';

export default function Heading({ title, description }: { title: string; description?: string }) {
    return <PageHeader title={title} description={description} className="mb-8" />;
}
