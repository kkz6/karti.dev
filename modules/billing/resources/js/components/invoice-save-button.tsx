import { Button } from '@shared/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { ChevronDown, Save, Send } from 'lucide-react';

export type InvoiceSaveAction = 'save' | 'send';

export function InvoiceSaveButton({
    action = 'save',
    canSend,
    disabled,
    onSave,
}: {
    action?: InvoiceSaveAction;
    canSend: boolean;
    disabled: boolean;
    onSave: (action: InvoiceSaveAction) => void;
}) {
    const selected = canSend ? action : 'save';
    return (
        <div className={canSend ? 'editor-save-group inline-flex items-center' : 'inline-flex items-center'} role="group" aria-label="Save invoice">
            <Button type="button" className={canSend ? 'rounded-r-none' : undefined} disabled={disabled} onClick={() => onSave(selected)}>
                {selected === 'send' ? <Send /> : <Save />}
                {selected === 'send' ? 'Save & send' : 'Save only'}
            </Button>
            {canSend && (
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
                        <DropdownMenuItem onSelect={() => onSave('send')}>
                            <Send /> Save & send
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
