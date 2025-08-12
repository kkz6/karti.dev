import { useLang } from '@shared/hooks/use-lang';
import { clsx } from 'clsx';
import React, { useEffect, useRef } from 'react';
import { resolveIcon } from './iconResolver';
import { getClickableColumn, useActions, useTable, visitUrl } from './inertiauiTable';
import { TableColumn, TableResource } from './types';
import { useStickyColumns, useStickyHeader } from './useStickyTable';

import { Badge } from '@shared/components/ui/badge';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Input } from '@shared/components/ui/input';
import { Table as ShadcnTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/components/ui/table';
import ActionsDropdown from './ActionsDropdown';
import AddFilterDropdown from './AddFilterDropdown';
import DynamicIcon from './DynamicIcon';
import EmptyState from './EmptyState';
import Filter from './Filter';
import LoadingSpinner from './LoadingSpinner';
import Pagination from './Pagination';
import RowActions from './RowActions';
import TableCellImage from './TableCellImage';
import TableHeaderDropdown from './TableHeaderDropdown';
import ToggleColumnDropdown from './ToggleColumnDropdown';

interface TableProps {
    resource: TableResource;
    iconResolver?: ((icon: string) => React.ComponentType<any>) | null;
    loading?: ((props: any) => React.ReactNode) | null;
    topbar?: ((props: any) => React.ReactNode) | null;
    filters?: ((props: any) => React.ReactNode) | null;
    table?: ((props: any) => React.ReactNode) | null;
    thead?: ((props: any) => React.ReactNode) | null;
    tbody?: ((props: any) => React.ReactNode) | null;
    footer?: ((props: any) => React.ReactNode) | null;
    emptyState?: ((props: any) => React.ReactNode) | null;
    header?: Record<string, (props: any) => React.ReactNode>;
    cell?: Record<string, (props: any) => React.ReactNode>;
    onRowClick?: ((item: any, column: TableColumn) => void) | null;
    onActionSuccess?: ((result: any) => void) | null;
    onActionError?: ((error: any) => void) | null;
    onCustomAction?: ((action: any, item?: any) => void) | null;
    image?: Record<string, (props: any) => React.ReactNode>;
    imageFallback?: Record<string, (props: any) => React.ReactNode>;
}

const Table: React.FC<TableProps> = ({
    resource,
    iconResolver = null,
    loading = null,
    topbar = null,
    filters = null,
    table = null,
    thead = null,
    tbody = null,
    footer = null,
    emptyState = null,
    header = {},
    cell = {},
    onRowClick = null,
    onActionSuccess = null,
    onActionError = null,
    onCustomAction = null,
    image = {},
    imageFallback = {},
}) => {
    const { t } = useLang();
    const tableInstance = useTable(resource);

    const {
        addFilter,
        hasFilters,
        hasSelectableRows,
        hasStickyColumns,
        isNavigating,
        isSortedByColumn,
        makeSticky,
        removeFilter,
        setFilter,
        setPerPage,
        setSearch,
        setSort,
        state,
        toggleColumn,
        undoSticky,
        visitPaginationUrl,
    } = tableInstance;

    const actions = useActions();
    const { performAction, performAsyncExport, toggleItem, isPerformingAction, allItemsAreSelected, selectedItems } = actions;

    const tableWrapperRef = useRef<HTMLDivElement>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const theadRef = useRef<HTMLTableSectionElement>(null);

    function scrollToTopOfTable() {
        if (tableWrapperRef.current) {
            window.scrollTo({
                top: tableWrapperRef.current.offsetTop - 16,
                // instant to match Inertia's behavior
                behavior: 'instant',
            });
        }
    }

    // Sticky Table Header
    const stickyHeader = useStickyHeader(
        () => tableContainerRef.current,
        () => theadRef.current,
    );

    // Sticky Columns
    const stickyColumns = useStickyColumns(() => tableContainerRef.current);

    useEffect(() => {
        if (!tableContainerRef.current) {
            return;
        }

        stickyColumns.add();
        const cleanup = [stickyColumns.remove];

        if (resource.stickyHeader) {
            stickyHeader.add();
            cleanup.push(stickyHeader.remove);
        }

        return () => cleanup.forEach((callback) => callback());
    }, []);

    function unstick(column: TableColumn) {
        undoSticky(column);
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollLeft = 0;
        }
    }

    // App is always LTR
    const isRtl = false;

    const verticalLineClasses = [
        "after:content-['']",
        'after:h-full',
        'after:w-px',
        'after:bg-gray-200',
        'after:absolute',
        'after:top-0',
        'after:right-0',
        'after:rtl:left-0',
        'after:rtl:right-auto',
        'after:dark:bg-zinc-700',
        'after:transition-opacity',
        'after:duration-300',
        'after:opacity-0',
        'group-data-[scroll-x]/table:after:opacity-100',
    ].join(' ');

    return (
        <div ref={tableWrapperRef} className="it-wrapper relative" {...(isPerformingAction ? { inert: true } : {})}>
            {isPerformingAction && (loading ? loading({ table: tableInstance, actions }) : <LoadingSpinner />)}

            {resource.emptyState && (resource.emptyState !== true || emptyState) ? (
                emptyState ? (
                    emptyState({ table: tableInstance })
                ) : (
                    <EmptyState
                        {...{ ...resource.emptyState, meta: undefined }}
                        iconResolver={(iconResolver ?? resolveIcon) as (icon: string) => React.ComponentType<any>}
                    />
                )
            ) : (
                <fieldset
                    className={clsx('min-w-0 space-y-4 transition-opacity', {
                        'opacity-50': isNavigating,
                        'opacity-75 blur-sm grayscale': isPerformingAction,
                    })}
                >
                    {/* Search and Actions */}
                    {topbar
                        ? topbar({ table: tableInstance, actions })
                        : (resource.hasBulkActions ||
                              resource.hasSearch ||
                              resource.hasExports ||
                              resource.hasFilters ||
                              resource.hasToggleableColumns) && (
                              <div className="it-topbar flex flex-col justify-between md:flex-row md:items-center md:space-x-4 rtl:md:space-x-reverse">
                                  {resource.hasSearch && (
                                      <Input
                                          value={state.search ?? ''}
                                          onChange={(e) => setSearch(e.target.value)}
                                          className="w-full md:max-w-md"
                                          autoFocus={resource.autofocus === 'search'}
                                          placeholder={t('table::table.search_placeholder')}
                                      />
                                  )}

                                  <div className="mt-4 flex gap-4 md:mt-0">
                                      {(resource.hasBulkActions || resource.hasExports) && (
                                          <ActionsDropdown
                                              actions={resource.actions || []}
                                              exports={resource.exports || []}
                                              selectedItems={selectedItems}
                                              performAction={performAction}
                                              performAsyncExport={performAsyncExport}
                                              iconResolver={(iconResolver ?? resolveIcon) as (icon: string) => React.ComponentType<any>}
                                              onSuccess={onActionSuccess}
                                              onError={onActionError}
                                              onHandle={onCustomAction}
                                          />
                                      )}

                                      {resource.hasFilters && (
                                          <AddFilterDropdown state={state.filters} filters={resource.filters} onAdd={addFilter} />
                                      )}

                                      {resource.hasToggleableColumns && (
                                          <ToggleColumnDropdown state={state.columns} columns={resource.columns} onToggle={toggleColumn} />
                                      )}
                                  </div>
                              </div>
                          )}

                    {/* Filters */}
                    {filters
                        ? filters({ table: tableInstance, actions })
                        : hasFilters && (
                              <div className="it-filters flex flex-wrap items-center space-y-2 space-x-2 md:space-y-0 md:space-x-4 rtl:space-x-reverse">
                                  {Object.entries(resource.filters).map(
                                      ([key, filter]: [string, any]) =>
                                          state.filters[filter.attribute].enabled && (
                                              <Filter
                                                  key={key}
                                                  value={state.filters[filter.attribute] as any}
                                                  onChange={(newState: any) => setFilter(filter, newState.clause, newState.value)}
                                                  filter={filter}
                                                  onRemove={() => removeFilter(filter)}
                                              />
                                          ),
                                  )}
                              </div>
                          )}

                    {/* Table */}
                    {table ? (
                        table({ table: tableInstance, actions })
                    ) : (
                        <div className="rounded-md border border-gray-200 dark:border-zinc-700">
                            <div
                                ref={tableContainerRef}
                                className="group/table relative w-full overflow-x-auto overflow-y-hidden rounded-md bg-white dark:bg-zinc-900"
                            >
                                <ShadcnTable className="it-table w-full caption-bottom text-left transition-opacity dark:text-zinc-300">
                                    {thead ? (
                                        thead({ table: tableInstance, actions })
                                    ) : resource.results?.data.length ? (
                                        <TableHeader
                                            ref={theadRef}
                                            className="it-table-head relative z-20 opacity-100 transition !duration-100 ease-out group-data-[scroll-y]/table:translate-y-[var(--header-offset)] group-data-[scroll-y]/table:shadow-lg group-data-[is-scrolling-y]/table:group-data-[scroll-y]/table:opacity-0"
                                        >
                                            <TableRow className="group border-b border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                {hasSelectableRows && (
                                                    <TableHead
                                                        data-column="_checkbox"
                                                        className={clsx(
                                                            'w-8 px-2 align-middle group-hover:bg-gray-100/50 dark:group-hover:bg-zinc-900/50',
                                                            {
                                                                'left-0 z-10 bg-white/90 group-data-[scroll-x]/table:sticky rtl:right-0 dark:bg-zinc-900/90':
                                                                    hasStickyColumns,
                                                            },
                                                        )}
                                                    >
                                                        <Checkbox
                                                            checked={allItemsAreSelected}
                                                            className="it-toggle-all-checkbox"
                                                            onCheckedChange={() => toggleItem('*')}
                                                        />
                                                    </TableHead>
                                                )}

                                                {resource.columns
                                                    .filter((column) => state.columns[column.attribute])
                                                    .map((column) => (
                                                        <TableHead
                                                            key={column.attribute}
                                                            data-column={column.attribute}
                                                            className={clsx(
                                                                'h-10 px-2 align-middle text-sm font-medium text-gray-500 group-hover:bg-gray-100/50 first:ps-4 dark:text-zinc-400 dark:group-hover:bg-zinc-900/50',
                                                                {
                                                                    'last:pe-4': column.attribute != '_actions',
                                                                    'z-10 bg-white/90 group-data-[scroll-x]/table:sticky dark:bg-zinc-900/90':
                                                                        state.sticky.includes(column.attribute),
                                                                    [verticalLineClasses]: state.sticky.at(-1) === column.attribute,
                                                                },
                                                            )}
                                                            style={
                                                                state.sticky.includes(column.attribute)
                                                                    ? {
                                                                          [isRtl ? 'right' : 'left']: `var(--column-${column.attribute}-offset)`,
                                                                      }
                                                                    : {}
                                                            }
                                                        >
                                                            <div
                                                                className={clsx('flex items-center', {
                                                                    'justify-start': column.alignment === 'left' || !column.alignment,
                                                                    'justify-center': column.alignment === 'center',
                                                                    'justify-end': column.alignment === 'right',
                                                                })}
                                                            >
                                                                {header[column.attribute] ? (
                                                                    header[column.attribute]({ column, table: tableInstance, actions })
                                                                ) : !column.sortable && !column.toggleable ? (
                                                                    <span className={clsx('font-semibold', column.headerClass)}>{column.header}</span>
                                                                ) : (
                                                                    <div
                                                                        className={clsx({
                                                                            '-ms-3': column.alignment === 'left',
                                                                            '-me-4': column.alignment === 'right',
                                                                        })}
                                                                    >
                                                                        <TableHeaderDropdown
                                                                            column={column}
                                                                            sort={isSortedByColumn(column)}
                                                                            sticky={state.sticky.includes(column.attribute)}
                                                                            onToggle={toggleColumn}
                                                                            onSort={setSort}
                                                                            onStick={makeSticky}
                                                                            onUnstick={unstick}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableHead>
                                                    ))}
                                            </TableRow>
                                        </TableHeader>
                                    ) : null}

                                    {tbody ? (
                                        tbody({ table: tableInstance, actions })
                                    ) : (
                                        <TableBody className="it-table-body [&_tr:last-child]:border-0">
                                            {!resource.results?.data.length ? (
                                                <TableRow>
                                                    <TableCell>
                                                        <p className="p-8 text-center font-medium text-gray-900 dark:text-zinc-200">
                                                            {t('table::table.no_results_found')}
                                                        </p>
                                                    </TableCell>
                                                </TableRow>
                                            ) : null}
                                            {resource.results?.data.map((item, itemIndex) => (
                                                <TableRow
                                                    key={hasSelectableRows ? item._primary_key : itemIndex}
                                                    className={clsx('group border-b border-gray-200 dark:border-zinc-700', {
                                                        'bg-gray-100 dark:bg-zinc-800':
                                                            selectedItems.includes(item._primary_key) || (item._is_selectable && allItemsAreSelected),
                                                    })}
                                                    {...{
                                                        'data-row-index': itemIndex,
                                                        ...(item._data_attributes ?? {}),
                                                    }}
                                                >
                                                    {hasSelectableRows && (
                                                        <TableCell
                                                            data-column="_checkbox"
                                                            className={clsx(
                                                                'w-8 px-2 align-middle transition-colors duration-150 group-hover:bg-gray-50/90 group-data-[state=selected]:bg-gray-100/90 group-hover:dark:bg-zinc-950/90 group-data-[state=selected]:dark:bg-zinc-800/90',
                                                                {
                                                                    'left-0 z-10 bg-white/90 group-data-[scroll-x]/table:sticky rtl:right-0 dark:bg-zinc-900/90':
                                                                        hasStickyColumns,
                                                                },
                                                            )}
                                                        >
                                                            <Checkbox
                                                                disabled={!item._is_selectable || allItemsAreSelected}
                                                                checked={
                                                                    selectedItems.includes(item._primary_key) ||
                                                                    (item._is_selectable && allItemsAreSelected)
                                                                }
                                                                className="it-toggle-item-checkbox"
                                                                onCheckedChange={() => toggleItem(item._primary_key)}
                                                            />
                                                        </TableCell>
                                                    )}

                                                    {resource.columns
                                                        .filter((column) => state.columns[column.attribute])
                                                        .map((column) => (
                                                            <TableCell
                                                                key={column.attribute}
                                                                data-column={column.attribute}
                                                                className={clsx(
                                                                    'p-2 align-middle whitespace-pre transition-colors duration-150 group-hover:bg-gray-50/90 group-data-[state=selected]:bg-gray-100/90 first:ps-4 dark:text-zinc-300 group-hover:dark:bg-zinc-950/90 group-data-[state=selected]:dark:bg-zinc-800/90',
                                                                    {
                                                                        'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400':
                                                                            onRowClick || getClickableColumn(column, item) || item._row_url,
                                                                        'last:pe-4': column.attribute != '_actions',
                                                                        'z-10 bg-white/90 group-data-[scroll-x]/table:sticky dark:bg-zinc-900/90':
                                                                            state.sticky.includes(column.attribute),
                                                                        [verticalLineClasses]: state.sticky.at(-1) === column.attribute,
                                                                    },
                                                                )}
                                                                style={
                                                                    state.sticky.includes(column.attribute)
                                                                        ? {
                                                                              [isRtl ? 'right' : 'left']: `var(--column-${column.attribute}-offset)`,
                                                                          }
                                                                        : {}
                                                                }
                                                                onClick={() => {
                                                                    if (column.attribute === '_actions') {
                                                                        return; // Don't handle click for actions column
                                                                    }

                                                                    if (onRowClick) {
                                                                        onRowClick(item, column);
                                                                    } else {
                                                                        const url = getClickableColumn(column, item);
                                                                        if (url) {
                                                                            visitUrl(url);
                                                                        } else if (item._row_url) {
                                                                            visitUrl(item._row_url);
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                <div
                                                                    className={clsx('flex items-center', {
                                                                        'justify-start': column.alignment === 'left',
                                                                        'justify-center': column.alignment === 'center',
                                                                        'justify-end': column.alignment === 'right',
                                                                        'whitespace-normal': column.wrap,
                                                                    })}
                                                                >
                                                                    {cell[column.attribute] ? (
                                                                        cell[column.attribute]({
                                                                            item,
                                                                            column,
                                                                            value: item[column.attribute],
                                                                            image: item._column_images?.[column.attribute],
                                                                            table: tableInstance,
                                                                            actions,
                                                                        })
                                                                    ) : (
                                                                        <TableCellImage
                                                                            data={item._column_images?.[column.attribute]}
                                                                            iconResolver={
                                                                                (iconResolver ?? resolveIcon) as (
                                                                                    icon: string,
                                                                                ) => React.ComponentType<any>
                                                                            }
                                                                            renderDefaultSlot={column.type !== 'image'}
                                                                            image={
                                                                                image[column.attribute]
                                                                                    ? () =>
                                                                                          image[column.attribute]({
                                                                                              item,
                                                                                              column,
                                                                                              value: item[column.attribute],
                                                                                              image: item._column_images?.[column.attribute],
                                                                                              table: tableInstance,
                                                                                          })
                                                                                    : null
                                                                            }
                                                                            fallback={
                                                                                imageFallback[column.attribute]
                                                                                    ? () =>
                                                                                          imageFallback[column.attribute]({
                                                                                              item,
                                                                                              column,
                                                                                              value: item[column.attribute],
                                                                                              image: item._column_images?.[column.attribute],
                                                                                              table: tableInstance,
                                                                                          })
                                                                                    : null
                                                                            }
                                                                        >
                                                                            {column.attribute === '_actions' ? (
                                                                                <RowActions
                                                                                    iconResolver={
                                                                                        (iconResolver ?? resolveIcon) as (
                                                                                            icon: string,
                                                                                        ) => React.ComponentType<any>
                                                                                    }
                                                                                    item={item}
                                                                                    actions={resource.actions || []}
                                                                                    performAction={performAction}
                                                                                    key={item._primary_key}
                                                                                    asDropdown={column.asDropdown}
                                                                                    onSuccess={onActionSuccess}
                                                                                    onError={onActionError}
                                                                                    onHandle={onCustomAction}
                                                                                />
                                                                            ) : column.type === 'badge' ? (
                                                                                <Badge
                                                                                    variant={
                                                                                        item[column.attribute]?.variant === 'danger'
                                                                                            ? 'destructive'
                                                                                            : item[column.attribute]?.variant === 'info'
                                                                                              ? 'default'
                                                                                              : item[column.attribute]?.variant === 'success'
                                                                                                ? 'secondary'
                                                                                                : item[column.attribute]?.variant === 'warning'
                                                                                                  ? 'outline'
                                                                                                  : 'outline'
                                                                                    }
                                                                                    className="it-badge gap-1"
                                                                                    data-style={item[column.attribute]?.variant}
                                                                                    data-variant={item[column.attribute]?.variant}
                                                                                >
                                                                                    {item[column.attribute]?.icon && (
                                                                                        <DynamicIcon
                                                                                            resolver={
                                                                                                (iconResolver ?? resolveIcon) as (
                                                                                                    icon: string,
                                                                                                ) => React.ComponentType<any>
                                                                                            }
                                                                                            icon={item[column.attribute].icon}
                                                                                            context={item[column.attribute]}
                                                                                            className="it-badge-icon size-3"
                                                                                        />
                                                                                    )}
                                                                                    <span>{item[column.attribute]?.value}</span>
                                                                                </Badge>
                                                                            ) : column.type === 'boolean' &&
                                                                              ((item[column.attribute] === true && column.trueIcon) ||
                                                                                  (item[column.attribute] === false && column.falseIcon)) ? (
                                                                                <DynamicIcon
                                                                                    resolver={iconResolver ?? resolveIcon}
                                                                                    icon={item[column.attribute] ? column.trueIcon : column.falseIcon}
                                                                                    className={clsx('it-boolean-icon size-6 self-center', {
                                                                                        'it-boolean-true-icon text-green-600': item[column.attribute],
                                                                                        'it-boolean-false-icon text-red-600': !item[column.attribute],
                                                                                    })}
                                                                                />
                                                                            ) : Array.isArray(item[column.attribute]) ? (
                                                                                <ul
                                                                                    className={clsx({
                                                                                        'line-clamp-[--line-clamp]': !!column.truncate,
                                                                                        [column.cellClass]: !!column.cellClass,
                                                                                    })}
                                                                                    style={
                                                                                        column.truncate
                                                                                            ? ({
                                                                                                  '--line-clamp': column.truncate,
                                                                                              } as React.CSSProperties)
                                                                                            : {}
                                                                                    }
                                                                                >
                                                                                    {item[column.attribute].map((value: any, index: number) => (
                                                                                        <li key={index}>{value}</li>
                                                                                    ))}
                                                                                </ul>
                                                                            ) : (
                                                                                <span
                                                                                    className={clsx({
                                                                                        'line-clamp-[--line-clamp]': !!column.truncate,
                                                                                        [column.cellClass]: !!column.cellClass,
                                                                                    })}
                                                                                    style={
                                                                                        column.truncate
                                                                                            ? ({
                                                                                                  '--line-clamp': column.truncate,
                                                                                              } as React.CSSProperties)
                                                                                            : {}
                                                                                    }
                                                                                >
                                                                                    {item[column.attribute]}
                                                                                </span>
                                                                            )}
                                                                        </TableCellImage>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    )}
                                </ShadcnTable>
                            </div>
                        </div>
                    )}

                    {/* Table Footer */}
                    {footer
                        ? footer({ table: tableInstance, actions })
                        : (hasSelectableRows || resource.pagination) && (
                              <div
                                  className={clsx('flex flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between dark:text-zinc-300', {
                                      'md:justify-end': !hasSelectableRows || selectedItems.length === 0,
                                  })}
                              >
                                  {hasSelectableRows && selectedItems.length > 0 && (
                                      <div className="flex-shrink-0 font-medium">
                                          {allItemsAreSelected && resource.results?.total === 1 ? (
                                              <p className="whitespace-nowrap">{t('table::table.one_row_selected')}</p>
                                          ) : allItemsAreSelected ? (
                                              <p className="whitespace-nowrap">
                                                  {t('table::table.all_rows_selected', { total: String(resource.results?.total || 0) })}
                                              </p>
                                          ) : selectedItems.length === 1 ? (
                                              <p className="whitespace-nowrap">{t('table::table.one_row_selected')}</p>
                                          ) : selectedItems.length > 0 ? (
                                              <p className="whitespace-nowrap">
                                                  {t('table::table.selected_rows', {
                                                      count: String(selectedItems.length),
                                                      total: String(resource.results?.total || 0),
                                                  })}
                                              </p>
                                          ) : null}
                                      </div>
                                  )}

                                  {resource.pagination && (
                                      <Pagination
                                          meta={resource.results as any}
                                          type={resource.paginationType as 'full' | 'simple'}
                                          options={resource.perPageOptions || []}
                                          perPage={state.perPage}
                                          onClick={(page: number) => visitPaginationUrl(String(page), scrollToTopOfTable)}
                                          onChange={setPerPage}
                                      />
                                  )}
                              </div>
                          )}
                </fieldset>
            )}
        </div>
    );
};

export default Table;
