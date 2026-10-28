import { Button } from '@shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { ChevronDown, CreditCard, Save, Send } from 'lucide-react';

export type InvoiceSaveAction = 'save' | 'send' | 'payment';

export function InvoiceSaveButton({
    action = 'save',
    canSend,
    canRecordPayment = false,
    disabled,
    onSave,
}: {
    action?: InvoiceSaveAction;
    canSend: boolean;
    canRecordPayment?: boolean;
    disabled: boolean;
    onSave: (action: InvoiceSaveAction) => void;
}) {
    const selected = (action === 'send' && !canSend) || (action === 'payment' && !canRecordPayment) ? 'save' : action;
    const hasOptions = canSend || canRecordPayment;
    return (
        <div
            className={hasOptions ? 'editor-save-group inline-flex items-center' : 'inline-flex items-center'}
            role="group"
            aria-label="Save invoice"
        >
            <Button type="button" className={hasOptions ? 'rounded-r-none' : undefined} disabled={disabled} onClick={() => onSave(selected)}>
                {selected === 'send' ? <Send /> : selected === 'payment' ? <CreditCard /> : <Save />}
                {selected === 'send' ? 'Save & send' : selected === 'payment' ? 'Save & record payment' : 'Save only'}
            </Button>
            {hasOptions && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            size="icon"
                            className="border-primary-foreground/25 rounded-l-none border-l"
                            aria-label="Invoice save options"
                            disabled={disabled}
                        >
                            <ChevronDown />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top">
                        <DropdownMenuItem onSelect={() => onSave('save')}>
                            <Save /> Save only
                        </DropdownMenuItem>
                        {canSend && (
                            <DropdownMenuItem onSelect={() => onSave('send')}>
                                <Send /> Save & send
                            </DropdownMenuItem>
                        )}
                        {canRecordPayment && (
                            <DropdownMenuItem onSelect={() => onSave('payment')}>
                                <CreditCard /> Save & record payment
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
