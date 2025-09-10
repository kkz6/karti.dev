import TagForm from '../../components/TagForm';

interface Tag {
    id: number;
    name: string;
    slug: string;
    description?: string;
    meta_title?: string;
    meta_description?: string;
}

export default function Edit({ tag }: { tag: Tag }) {
    return <TagForm tag={tag} mode="edit" />;
}
