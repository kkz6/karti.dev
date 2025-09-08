import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { useInitials } from '@shared/hooks/use-initials';
import { type User } from '@shared/types';

export function UserInfo({ user, showEmail = false }: { user: User | null; showEmail?: boolean }) {
    const getInitials = useInitials();

    if (!user) {
        return (
            <>
                <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                        G
                    </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Guest</span>
                    {showEmail && <span className="truncate text-xs text-muted-foreground">Not logged in</span>}
                </div>
            </>
        );
    }

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {showEmail && <span className="truncate text-xs text-muted-foreground">{user.email}</span>}
            </div>
        </>
    );
}
