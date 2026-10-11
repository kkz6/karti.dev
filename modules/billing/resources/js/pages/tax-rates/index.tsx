import type { TableConfig } from '@table/components';
import { CatalogueIndex } from '../../components/catalogue-index';

export default function TaxRates(props: { table: TableConfig; canCreate: boolean }) {
    return <CatalogueIndex {...props} />;
}
