import type { TableConfig } from '@table/components';
import { CatalogueIndex } from '../../components/catalogue-index';

export default function TaxRates(props: { table: TableConfig; canCreate: boolean; canView: boolean }) {
    return <CatalogueIndex {...props} />;
}
