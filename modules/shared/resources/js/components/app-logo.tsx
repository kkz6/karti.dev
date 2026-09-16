import { usePage } from '@inertiajs/react';
import type { SharedData } from '@shared/types';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    const { site } = usePage<SharedData>().props;
    return (
        <>
            <div className="flex aspect-square size-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-md">
                <AppLogoIcon className="size-8 rounded-md" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="mb-0.5 truncate leading-tight font-semibold">{site.name}</span>
            </div>
        </>
    );
}
