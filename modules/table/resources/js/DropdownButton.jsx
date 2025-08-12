import { Button } from '@shared/components/ui/button'

export default function DropdownButton({ title, children, icon }) {
    const hasIcon = !!icon

    return (
        <Button
            asChild
            variant="ghost"
            className="it-dropdown-button w-full justify-start"
        >
            <div>
                {hasIcon && <div className="me-2 size-4">{icon}</div>}
                <span>{title || children}</span>
            </div>
        </Button>
    )
}
