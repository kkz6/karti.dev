import TaxonomyForm, { type TaxonomyEntry } from './TaxonomyForm';

export default function TagForm({ tag, mode }: { tag?: TaxonomyEntry; mode: 'create' | 'edit' }) {
    return <TaxonomyForm kind="tag" entry={mode === 'edit' ? tag : undefined} />;
}
