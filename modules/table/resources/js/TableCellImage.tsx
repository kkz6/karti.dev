import clsx from 'clsx';
import React, { useMemo } from 'react';
import DynamicIcon from './DynamicIcon';
import type { TableCellImageProps } from './types';

export default function TableCellImage({
    data,
    iconResolver,
    renderDefaultSlot,
    children,
    fallback,
    image,
}: TableCellImageProps): React.ReactElement {
    const images = useMemo(() => {
        if (!data) {
            return [];
        }

        if (data.icon) {
            return [null];
        }

        const urls = Array.isArray(data.url) ? data.url : [data.url];
        return urls.filter(Boolean);
    }, [data]);

    if (!data && renderDefaultSlot) {
        return <>{children}</>;
    }

    return (
        <div
            className={clsx('it-table-image-wrapper flex min-w-max items-center', {
                'flex-row': data?.position === 'start',
                'flex-row-reverse': data?.position === 'end',
            })}
        >
            {/* Image slot */}
            {image ? (
                image()
            ) : (
                <>
                    {images.length > 0 ? (
                        <div
                            className={clsx({
                                'flex flex-row -space-x-1 overflow-hidden': images.length > 1,
                            })}
                        >
                            {images.map((imageUrl, index) => {
                                const commonProps = {
                                    alt: data?.alt,
                                    title: data?.title,
                                    width: data?.width,
                                    height: data?.height,
                                    className: clsx(
                                        'it-table-image',
                                        {
                                            'size-4': data?.size === 'small',
                                            'size-6': data?.size === 'medium',
                                            'size-8': data?.size === 'large',
                                            'size-10': data?.size === 'extra-large',
                                            'rounded-full': data?.rounded,
                                            'ring-2 ring-white': images.length > 1,
                                        },
                                        data?.class,
                                    ),
                                };

                                return data?.icon ? (
                                    <DynamicIcon key={index} icon={data.icon} resolver={iconResolver as any} {...commonProps} />
                                ) : (
                                    <img key={index} src={imageUrl || ''} loading="lazy" {...commonProps} />
                                );
                            })}
                            {data?.remaining && (
                                <div className="flex items-center justify-center ps-2 text-xs font-medium text-gray-500">
                                    <span>+{data.remaining}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        fallback?.()
                    )}
                </>
            )}
            {/* Default slot */}
            {renderDefaultSlot && (
                <div
                    className={clsx('grow', {
                        'ms-2': data?.position === 'start',
                        'me-2': data?.position === 'end',
                    })}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
