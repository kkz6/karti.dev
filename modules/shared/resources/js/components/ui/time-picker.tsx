import { Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { ScrollArea } from './scroll-area';

interface TimePickerProps {
    value?: { hour: number; minute: number };
    onChange: (time: { hour: number; minute: number }) => void;
    hourCycle?: 12 | 24;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

export function TimePicker({ value, onChange, hourCycle = 12, className, placeholder = 'Select time', disabled = false }: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hour, setHour] = useState(value?.hour ?? 12);
    const [minute, setMinute] = useState(value?.minute ?? 0);
    const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            if (hourCycle === 12) {
                const h = value.hour === 0 ? 12 : value.hour > 12 ? value.hour - 12 : value.hour;
                setHour(h);
                setPeriod(value.hour >= 12 ? 'PM' : 'AM');
            } else {
                setHour(value.hour);
            }
            setMinute(value.minute);
        }
    }, [value, hourCycle]);

    const formatTime = () => {
        if (!value) return '';
        const h = value.hour.toString().padStart(2, '0');
        const m = value.minute.toString().padStart(2, '0');
        if (hourCycle === 24) {
            return `${h}:${m}`;
        }
        const displayHour = value.hour === 0 ? 12 : value.hour > 12 ? value.hour - 12 : value.hour;
        const displayPeriod = value.hour >= 12 ? 'PM' : 'AM';
        return `${displayHour.toString().padStart(2, '0')}:${m} ${displayPeriod}`;
    };

    const handleTimeChange = (newHour: number, newMinute: number, newPeriod?: 'AM' | 'PM') => {
        let actualHour = newHour;
        if (hourCycle === 12) {
            const currentPeriod = newPeriod ?? period;
            if (currentPeriod === 'PM' && newHour !== 12) {
                actualHour = newHour + 12;
            } else if (currentPeriod === 'AM' && newHour === 12) {
                actualHour = 0;
            }
        }
        onChange({ hour: actualHour, minute: newMinute });
    };

    const handleHourClick = (h: number) => {
        setHour(h);
        handleTimeChange(h, minute);
    };

    const handleMinuteClick = (m: number) => {
        setMinute(m);
        handleTimeChange(hour, m);
    };

    const handlePeriodChange = (p: 'AM' | 'PM') => {
        setPeriod(p);
        handleTimeChange(hour, minute, p);
    };

    const hours = hourCycle === 12 ? Array.from({ length: 12 }, (_, i) => i + 1) : Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    useEffect(() => {
        if (isOpen && hourRef.current) {
            const selectedHour = hourRef.current.querySelector('[data-selected="true"]');
            if (selectedHour) {
                selectedHour.scrollIntoView({ block: 'center', behavior: 'instant' });
            }
        }
        if (isOpen && minuteRef.current) {
            const selectedMinute = minuteRef.current.querySelector('[data-selected="true"]');
            if (selectedMinute) {
                selectedMinute.scrollIntoView({ block: 'center', behavior: 'instant' });
            }
        }
    }, [isOpen]);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground', className)}
                    disabled={disabled}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {value ? formatTime() : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex p-2">
                    {/* Hour selection */}
                    <div className="flex flex-col">
                        <div className="px-3 py-2 text-sm font-semibold">Hour</div>
                        <ScrollArea className="h-64 w-20" ref={hourRef}>
                            <div className="p-1">
                                {hours.map((h) => (
                                    <Button
                                        key={h}
                                        variant={hour === h ? 'default' : 'ghost'}
                                        size="sm"
                                        className="mb-1 w-full"
                                        onClick={() => handleHourClick(h)}
                                        data-selected={hour === h}
                                    >
                                        {h.toString().padStart(2, '0')}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Minute selection */}
                    <div className="flex flex-col border-x">
                        <div className="px-3 py-2 text-sm font-semibold">Minute</div>
                        <ScrollArea className="h-64 w-20" ref={minuteRef}>
                            <div className="p-1">
                                {minutes.map((m) => (
                                    <Button
                                        key={m}
                                        variant={minute === m ? 'default' : 'ghost'}
                                        size="sm"
                                        className="mb-1 w-full"
                                        onClick={() => handleMinuteClick(m)}
                                        data-selected={minute === m}
                                    >
                                        {m.toString().padStart(2, '0')}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* AM/PM selection for 12-hour format */}
                    {hourCycle === 12 && (
                        <div className="flex flex-col">
                            <div className="px-3 py-2 text-sm font-semibold">Period</div>
                            <div className="space-y-1 p-2">
                                <Button
                                    variant={period === 'AM' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handlePeriodChange('AM')}
                                >
                                    AM
                                </Button>
                                <Button
                                    variant={period === 'PM' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handlePeriodChange('PM')}
                                >
                                    PM
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick time input */}
                <div className="border-t p-3">
                    <div className="flex items-center gap-2">
                        <Input
                            type="text"
                            placeholder="HH:MM"
                            value={formatTime()}
                            onChange={(e) => {
                                const value = e.target.value;
                                const timeRegex = hourCycle === 12 ? /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)?$/i : /^([0-1]?\d|2[0-3]):([0-5]\d)$/;
                                const match = value.match(timeRegex);
                                if (match) {
                                    const h = parseInt(match[1]);
                                    const m = parseInt(match[2]);
                                    if (hourCycle === 12 && match[3]) {
                                        const p = match[3].toUpperCase() as 'AM' | 'PM';
                                        setPeriod(p);
                                        setHour(h);
                                        setMinute(m);
                                        handleTimeChange(h, m, p);
                                    } else {
                                        setHour(h);
                                        setMinute(m);
                                        handleTimeChange(h, m);
                                    }
                                }
                            }}
                            className="text-center"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const now = new Date();
                                const h =
                                    hourCycle === 12
                                        ? now.getHours() === 0
                                            ? 12
                                            : now.getHours() > 12
                                              ? now.getHours() - 12
                                              : now.getHours()
                                        : now.getHours();
                                const m = now.getMinutes();
                                const p = now.getHours() >= 12 ? 'PM' : 'AM';
                                setHour(h);
                                setMinute(m);
                                if (hourCycle === 12) {
                                    setPeriod(p);
                                    handleTimeChange(h, m, p);
                                } else {
                                    handleTimeChange(h, m);
                                }
                            }}
                        >
                            Now
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
