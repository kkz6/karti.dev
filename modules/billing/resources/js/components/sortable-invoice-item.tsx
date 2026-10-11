import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@shared/components/ui/button';
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
        <div
            role="rowgroup"
            ref={setNodeRef}
            data-invoice-item={id}
            data-dragging={isDragging || undefined}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            className={`bg-card relative border-b p-3 last:border-b-0 ${isDragging ? 'ring-primary/30 z-10 shadow-md ring-1 ring-inset' : ''}`}
        >
            {children(handle)}
        </div>
    );
}
