import Button from './Button'

export default function DropdownButton({ title, children, icon }) {
    const hasIcon = !!icon

    return (
        <Button
            as="div"
            className="it-dropdown-button w-full"
        >
            {hasIcon && <div className="me-2 size-4">{icon}</div>}
            <span>{title || children}</span>
        </Button>
    )
}
