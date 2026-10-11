import type { TableConfig } from '@table/components';
import { CatalogueIndex } from '../../components/catalogue-index';

export default function Services(props: { table: TableConfig; canCreate: boolean }) {
    return <CatalogueIndex {...props} kind="services" />;
}
