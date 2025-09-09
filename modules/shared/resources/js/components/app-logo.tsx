export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md overflow-hidden flex-shrink-0">
                <img 
                    src="/images/avatar.png" 
                    alt="karti.dev logo" 
                    className="size-8 object-cover rounded-md"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="mb-0.5 truncate leading-tight font-semibold">karti.dev</span>
            </div>
        </>
    );
}
