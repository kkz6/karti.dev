import { Button } from '@shared/components/ui/button';
import { Slider } from '@shared/components/ui/slider';
import { Contrast, Eye, Palette, RotateCcw, Sun, Thermometer, Zap } from 'lucide-react';
import type { FilterOptions } from '../../utils/imageFilters';

const filters = [
    { name: 'brightness', label: 'Brightness', min: -100, icon: Sun },
    { name: 'contrast', label: 'Contrast', min: -100, icon: Contrast },
    { name: 'saturation', label: 'Saturation', min: -100, icon: Eye },
    { name: 'vibrance', label: 'Vibrance', min: -100, icon: Zap },
    { name: 'exposure', label: 'Exposure', min: -100, icon: Thermometer },
    { name: 'hue', label: 'Hue', min: 0, icon: Palette },
] as const;

export function ImageFilters({
    processing,
    applyFilter,
    camanFilters,
}: {
    processing: boolean;
    applyFilter: (name: string, value: number | null) => void;
    camanFilters: FilterOptions;
}) {
    return (
        <div className="space-y-6">
            {filters.map(({ name, label, min, icon: Icon }) => {
                const value = Number(camanFilters[name] ?? 0);
                return (
                    <div key={name} className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                            <Icon aria-hidden="true" className="text-muted-foreground size-4" />
                            <span id={`image-adjust-${name}`}>{label}</span>
                            <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                                {value > 0 ? '+' : ''}
                                {value}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                aria-label={`Reset ${label.toLowerCase()}`}
                                disabled={processing || value === 0}
                                onClick={() => applyFilter(name, null)}
                            >
                                <RotateCcw className="size-3" />
                            </Button>
                        </div>
                        <Slider
                            aria-labelledby={`image-adjust-${name}`}
                            value={[value]}
                            min={min}
                            max={100}
                            step={1}
                            disabled={processing}
                            onValueChange={([next]) => applyFilter(name, next === 0 ? null : next)}
                        />
                    </div>
                );
            })}
            <div className="border-border/60 flex flex-wrap gap-2 border-t pt-4">
                {(['greyscale', 'invert'] as const).map((name) => (
                    <Button
                        key={name}
                        type="button"
                        variant={camanFilters[name] ? 'secondary' : 'outline'}
                        size="sm"
                        aria-pressed={Boolean(camanFilters[name])}
                        disabled={processing}
                        onClick={() => applyFilter(name, camanFilters[name] ? null : 1)}
                    >
                        {name === 'greyscale' ? 'Black & white' : 'Invert colors'}
                    </Button>
                ))}
            </div>
        </div>
    );
}
