import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@shared/components/ui/button';
import { Card } from '@shared/components/ui/card';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';
export function SortableInvoiceItem({
    id,
    number,
    disabled,
    children,
}: {
    id: string;
    number: number;
    disabled: boolean;
    children: (handle: ReactNode) => ReactNode;
}) {
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
    const handle = (
        <Button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={`Drag item ${number} to reorder`}
            className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
        >
            <GripVertical />
        </Button>
    );
    return (
        <Card
            ref={setNodeRef}
            data-invoice-item={id}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`relative gap-3 rounded-none border-0 border-b bg-transparent p-3 shadow-none last:border-b-0 ${isDragging ? 'border-primary z-10 opacity-90 shadow-lg' : 'border-border'}`}
        >
            {children(handle)}
        </Card>
    );
}
