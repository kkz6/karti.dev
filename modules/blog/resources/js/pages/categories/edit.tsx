import TaxonomyForm, { type TaxonomyEntry } from '../../components/TaxonomyForm';

export default function Edit({ category }: { category: TaxonomyEntry }) {
    return <TaxonomyForm kind="category" entry={category} />;
}
