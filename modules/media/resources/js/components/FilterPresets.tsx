import { Button } from '@shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/components/ui/tooltip';
import React from 'react';

interface FilterPresetsProps {
    processing: boolean;
    camanFilters: Record<string, any>;
    applyFilter: (name: string, value: any) => void;
}

interface Preset {
    name: string;
    displayName: string;
    shortName: string;
}

export const FilterPresets: React.FC<FilterPresetsProps> = ({ processing, camanFilters, applyFilter }) => {
    const presets: Preset[] = [
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
    ];

    const isPresetActive = (presetName: string) => {
        return camanFilters.hasOwnProperty(presetName);
    };

    const applyPreset = (presetName: string) => {
        // Check if preset is already active, if so remove it, otherwise apply it
        if (isPresetActive(presetName)) {
            applyFilter(presetName, false);
        } else {
            applyFilter(presetName, true);
        }
    };

    // Group presets into chunks of 3 for better layout
    const chunkedPresets = [];
    for (let i = 0; i < presets.length; i += 3) {
        chunkedPresets.push(presets.slice(i, i + 3));
    }

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300" style={{ opacity: processing ? 0.5 : 1 }}>
                    Presets
                </h3>

                <div className="space-y-2">
                    {chunkedPresets.map((chunk, chunkIndex) => (
                        <div key={chunkIndex} className="flex space-x-2">
                            {chunk.map((preset) => (
                                <Tooltip key={preset.name}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={processing}
                                            className={`h-10 flex-1 font-mono text-xs ${
                                                isPresetActive(preset.name)
                                                    ? 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-600 dark:bg-blue-900 dark:text-blue-300'
                                                    : ''
                                            }`}
                                            onClick={() => applyPreset(preset.name)}
                                        >
                                            {processing ? (
                                                <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-gray-600 dark:border-gray-400"></div>
                                            ) : (
                                                preset.shortName
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{preset.displayName}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">Click presets to apply vintage and artistic effects to your image.</div>
            </div>
        </TooltipProvider>
    );
};
