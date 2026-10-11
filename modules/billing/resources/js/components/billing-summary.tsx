import { StatSummary, type SummaryItem } from '@shared/components/stat-summary';
export function BillingSummary({ items }: { items: SummaryItem[] }) {
    return <StatSummary items={items} />;
}
