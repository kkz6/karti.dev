import { Button } from '@shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/components/ui/tooltip';
import { Download, FileText } from 'lucide-react';

export function InvoicePdfButtons({
    invoiceId,
    draft = false,
    disabled = false,
    iconOnly = false,
}: {
    invoiceId: number;
    draft?: boolean;
    disabled?: boolean;
    iconOnly?: boolean;
}) {
    const previewLabel = draft ? 'Preview draft PDF' : 'Preview PDF';
    const controls = [
        { label: previewLabel, Icon: FileText, href: route('admin.invoices.pdf', invoiceId), target: '_blank' },
        { label: 'Download PDF', Icon: Download, href: route('admin.invoices.pdf', { invoice: invoiceId, download: 1 }), target: undefined },
    ];
    return (
        <TooltipProvider delayDuration={150}>
            <div className="flex flex-wrap gap-2">
                {controls.map(({ label, Icon, href, target }) => (
                    <Tooltip key={label}>
                        <TooltipTrigger asChild>
                            {disabled ? (
                                <Button variant="outline" size={iconOnly ? 'icon' : 'default'} aria-label={label} disabled>
                                    <Icon className="size-4" />
                                    {!iconOnly && label}
                                </Button>
                            ) : (
                                <Button variant="outline" size={iconOnly ? 'icon' : 'default'} asChild>
                                    <a href={href} target={target} rel={target ? 'noopener noreferrer' : undefined} aria-label={label}>
                                        <Icon className="size-4" />
                                        {!iconOnly && label}
                                    </a>
                                </Button>
                            )}
                        </TooltipTrigger>
                        {iconOnly && <TooltipContent>{label}</TooltipContent>}
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
}
