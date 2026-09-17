import { Button } from '@shared/components/ui/button';
import { Check } from 'lucide-react';
import type { FilterOptions } from '../../utils/imageFilters';

export function FilterPresets({
    processing,
    camanFilters,
    applyFilter,
}: {
    processing: boolean;
    camanFilters: FilterOptions;
    applyFilter: (name: string, value: boolean) => void;
}) {
    const presets = [
        { name: 'clarity', displayName: 'Clarity', shortName: 'CL' },
        { name: 'pinhole', displayName: 'Pinhole', shortName: 'PH' },
        { name: 'love', displayName: 'Love', shortName: 'LV' },
        { name: 'jarques', displayName: 'Jarques', shortName: 'JQ' },
        { name: 'orangePeel', displayName: 'Orange Peel', shortName: 'OP' },
        { name: 'sinCity', displayName: 'Sin City', shortName: 'SC' },
        { name: 'grungy', displayName: 'Grungy', shortName: 'GR' },
        { name: 'oldBoot', displayName: 'Old Boot', shortName: 'OB' },
        { name: 'lomo', displayName: 'Lomo', shortName: 'LM' },
        { name: 'vintage', displayName: 'Vintage', shortName: 'VT' },
        { name: 'crossProcess', displayName: 'Cross Process', shortName: 'CP' },
        { name: 'concentrate', displayName: 'Concentrate', shortName: 'CN' },
        { name: 'glowingSun', displayName: 'Glowing Sun', shortName: 'GS' },
        { name: 'sunrise', displayName: 'Sunrise', shortName: 'SR' },
        { name: 'nostalgia', displayName: 'Nostalgia', shortName: 'NS' },
        { name: 'hemingway', displayName: 'Hemingway', shortName: 'HM' },
        { name: 'herMajesty', displayName: 'Her Majesty', shortName: 'HMJ' },
        { name: 'hazyDays', displayName: 'Hazy Days', shortName: 'HD' },
    ] as const;

    return (
        <div className="space-y-4">
            <p className="text-muted-foreground text-xs leading-relaxed">Combine looks, or select an active preset again to remove it.</p>
            <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => {
                    const active = Boolean(camanFilters[preset.name]);
                    return (
                        <Button
                            key={preset.name}
                            type="button"
                            variant={active ? 'secondary' : 'outline'}
                            disabled={processing}
                            aria-pressed={active}
                            className="h-auto min-h-10 justify-between gap-1 px-3 py-2 text-left text-xs whitespace-normal"
                            onClick={() => applyFilter(preset.name, !active)}
                        >
                            {preset.displayName}
                            {active && <Check aria-hidden="true" className="size-3.5 shrink-0" />}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
