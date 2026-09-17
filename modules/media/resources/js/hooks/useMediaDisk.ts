import { usePage } from '@inertiajs/react';
import type { SharedData } from '@shared/types';

/** Use Laravel's environment-backed configuration unless a field explicitly chooses a disk. */
export function useMediaDisk(container?: string | null): string {
    const { mediaLibrary } = usePage<SharedData>().props;
    return container || mediaLibrary.defaultDisk;
}
