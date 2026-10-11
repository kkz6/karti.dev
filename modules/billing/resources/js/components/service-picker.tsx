import { Button } from '@shared/components/ui/button';
import { Card } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import axios from 'axios';
import { useEffect, useState } from 'react';
import type { Service } from '../types';
import { BillingFeedback } from './billing-feedback';

export type ServiceChoice = Omit<Service, 'tax_rates'> & { tax_rates: { id: number; name: string; percentage: string }[] };

export function ServicePicker({ currency, lineKey, onSelect }: { currency: string; lineKey: string; onSelect: (service: ServiceChoice) => void }) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<ServiceChoice[]>([]);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        setResults([]);
        setFailed(false);
        if (!search.trim() || !currency) return;
        const abort = new AbortController();
        const timer = setTimeout(() => {
            axios
                .get(route('admin.services.lookup'), { params: { currency, search }, signal: abort.signal })
                .then(({ data }) => setResults(data.services))
                .catch((error) => {
                    if (!axios.isCancel(error)) setFailed(true);
                });
        }, 250);
        return () => {
            clearTimeout(timer);
            abort.abort();
        };
    }, [search, currency]);
    return (
        <div className="space-y-2">
            <Label htmlFor={`service-${lineKey}`}>Find a service</Label>
            <Input
                id={`service-${lineKey}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={currency ? `Search services priced in ${currency}` : 'Choose an invoice currency first'}
                disabled={!currency}
            />
            {failed && <BillingFeedback kind="error">Services could not be loaded. Try again.</BillingFeedback>}
            {results.length > 0 && (
                <Card className="divide-y">
                    {results.slice(0, 6).map((service) => (
                        <Button
                            key={service.id}
                            type="button"
                            variant="ghost"
                            className="h-auto w-full justify-between gap-4 rounded-none px-3 py-3 text-left"
                            aria-label={`Use ${service.name}`}
                            onClick={() => {
                                onSelect(service);
                                setSearch('');
                                setResults([]);
                            }}
                        >
                            <span className="min-w-0 truncate">{service.name}</span>
                            <span className="shrink-0 text-xs tabular-nums">
                                {service.rate} {service.currency} / {service.unit}
                            </span>
                        </Button>
                    ))}
                </Card>
            )}
        </div>
    );
}
