import { trans } from './translations.js'
import { Button } from '@shared/components/ui/button'
import { cn } from '@shared/lib/utils'
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react'

export default function Pagination({ meta, options, perPage, type = 'full', onClick, onChange }) {
    const translatedString = useMemo(() => {
        let params = {
            current_page: meta.current_page,
            current: meta.current_page,
            from: meta.from,
            on_first_page: meta.on_first_page,
            on_last_page: meta.on_last_page,
            per_page: meta.per_page,
            to: meta.to,
            type: type,
        }

        if (type === 'full') {
            params = {
                ...params,
                last: meta.last_page,
                last_page: meta.last_page,
                total: meta.total,
            }
        }

        return trans(type === 'full' ? 'current_page_of_last' : 'current_page', params)
    }, [meta, type])

    return (
        <div className="it-pagination flex w-full justify-between space-x-6 md:w-auto md:items-center lg:space-x-8 rtl:space-x-reverse">
            <div className="flex flex-col md:flex-row md:items-center">
                <p className="mb-1 font-medium md:mb-0 md:me-2">{trans('rows_per_page')}</p>
                <select
                    value={perPage}
                    className={cn(
                        "it-pagination-per-page-select",
                        "border-input bg-background text-foreground flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {options.map((option) => (
                        <option
                            key={option}
                            value={option}
                        >
                            {option}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex flex-col md:flex-row md:items-center">
                {type !== 'cursor' && <div className="mb-1 font-medium tabular-nums md:mb-0 md:me-4">{translatedString}</div>}
                <div className="flex flex-row items-center space-x-2 rtl:flex-row-reverse">
                    <Button
                        disabled={meta.on_first_page}
                        variant="outline"
                        size="sm"
                        className="it-pagination-first-page-button"
                        onClick={() => onClick(meta.first_page_url)}
                        aria-label="Go to first page"
                    >
                        <ChevronsLeft className="size-4" />
                    </Button>
                    <Button
                        disabled={!meta.prev_page_url}
                        variant="outline"
                        size="sm"
                        className="it-pagination-previous-page-button"
                        onClick={() => onClick(meta.prev_page_url)}
                        aria-label="Go to previous page"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                        disabled={!meta.next_page_url}
                        variant="outline"
                        size="sm"
                        className="it-pagination-next-page-button"
                        onClick={() => onClick(meta.next_page_url)}
                        aria-label="Go to next page"
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                    {type === 'full' && (
                        <Button
                            disabled={meta.on_last_page}
                            variant="outline"
                            size="sm"
                            className="it-pagination-last-page-button"
                            onClick={() => onClick(meta.last_page_url)}
                            aria-label="Go to last page"
                        >
                            <ChevronsRight className="size-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
