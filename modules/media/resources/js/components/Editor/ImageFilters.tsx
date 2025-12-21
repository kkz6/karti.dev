import { Button } from '@shared/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { Slider } from '@shared/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/components/ui/tooltip';
import { Contrast, Eye, Palette, Sun, Thermometer, X, Zap } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface Filter {
    step: number | null;
    min: number | null;
    max: number | null;
    icon: React.ReactNode;
    filterName: string;
    displayName: string;
}

interface ImageFiltersProps {
    processing: boolean;
    reset: boolean;
    applyFilter: (name: string, value: number | null) => void;
    camanFilters: Record<string, any>;
}

export const ImageFilters: React.FC<ImageFiltersProps> = ({ processing, reset, applyFilter, camanFilters }) => {
    const [filterValues, setFilterValues] = useState<Record<string, number>>({});

    const filters: Filter[] = [
        {
            step: 1,
            min: -100,
            max: 100,
            icon: <Sun className="h-4 w-4" />,
            filterName: 'brightness',
            displayName: 'Brightness',
        },
        {
            step: 1,
            min: -100,
            max: 100,
            icon: <Contrast className="h-4 w-4" />,
            filterName: 'contrast',
            displayName: 'Contrast',
        },
        {
            step: 1,
            min: -100,
            max: 100,
            icon: <Eye className="h-4 w-4" />,
            filterName: 'saturation',
            displayName: 'Saturation',
        },
        {
            step: 1,
            min: -100,
            max: 100,
            icon: <Zap className="h-4 w-4" />,
            filterName: 'vibrance',
            displayName: 'Vibrance',
        },
        {
            step: 1,
            min: -100,
            max: 100,
            icon: <Thermometer className="h-4 w-4" />,
            filterName: 'exposure',
            displayName: 'Exposure',
        },
        {
            step: 1,
            min: 0,
            max: 100,
            icon: <Palette className="h-4 w-4" />,
            filterName: 'hue',
            displayName: 'Hue',
        },
    ];

    // Toggle filters (no slider)
    const toggleFilters = [
        {
            filterName: 'greyscale',
            displayName: 'Greyscale',
            icon: <div className="h-4 w-4 rounded bg-gray-400"></div>,
        },
        {
            filterName: 'invert',
            displayName: 'Invert',
            icon: <div className="h-4 w-4 rounded bg-gradient-to-r from-white to-black"></div>,
        },
    ];

    // Reset filters when reset prop changes
    useEffect(() => {
        if (reset) {
            setFilterValues({});
        }
    }, [reset]);

    const handleFilterChange = useCallback(
        (filterName: string, value: number | null) => {
            if (value !== null) {
                setFilterValues((prev) => ({ ...prev, [filterName]: value }));
            } else {
                setFilterValues((prev) => {
                    const { [filterName]: removed, ...rest } = prev;
                    return rest;
                });
            }
            applyFilter(filterName, value);
        },
        [applyFilter],
    );

    const resetFilter = useCallback(
        (filterName: string) => {
            handleFilterChange(filterName, null);
        },
        [handleFilterChange],
    );

    const isFilterActive = (filterName: string) => {
        return camanFilters.hasOwnProperty(filterName);
    };

    const getCurrentValue = (filterName: string) => {
        return filterValues[filterName] || 0;
    };

    return (
        <TooltipProvider>
            <div className="flex flex-wrap gap-2">
                {/* Slider-based filters */}
                {filters.map((filter) => (
                    <Popover key={filter.filterName}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={processing}
                                        className={`h-10 w-10 p-0 ${
                                            isFilterActive(filter.filterName) ? 'border border-blue-300 bg-blue-100 text-blue-700' : ''
                                        }`}
                                    >
                                        {filter.icon}
                                    </Button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{filter.displayName}</p>
                            </TooltipContent>
                        </Tooltip>

                        <PopoverContent className="w-64">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">{filter.displayName}</h4>
                                    {getCurrentValue(filter.filterName) !== 0 && (
                                        <Button variant="ghost" size="sm" onClick={() => resetFilter(filter.filterName)} className="h-6 w-6 p-0">
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="text-center font-mono text-sm">{getCurrentValue(filter.filterName)}</div>
                                    <Slider
                                        value={[getCurrentValue(filter.filterName)]}
                                        onValueChange={(value) => handleFilterChange(filter.filterName, value[0])}
                                        max={filter.max!}
                                        min={filter.min!}
                                        step={filter.step!}
                                        disabled={processing}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                ))}

                {/* Toggle filters */}
                {toggleFilters.map((filter) => (
                    <Tooltip key={filter.filterName}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={processing}
                                className={`h-10 w-10 p-0 ${
                                    isFilterActive(filter.filterName) ? 'border border-blue-300 bg-blue-100 text-blue-700' : ''
                                }`}
                                onClick={() => handleFilterChange(filter.filterName, isFilterActive(filter.filterName) ? null : 1)}
                            >
                                {filter.icon}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{filter.displayName}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
};
