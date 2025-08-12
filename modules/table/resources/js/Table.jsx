import { clsx } from 'clsx'
import { getClickableColumn, useActions, useTable, visitUrl } from './inertiauiTable'
import { resolveIcon } from './iconResolver.js'
import { trans } from './translations.js'
import { useEffect, useRef } from 'react'
// App is always LTR, so we don't need RTL logic
import { useStickyColumns, useStickyHeader } from './useStickyTable'

import ActionsDropdown from './ActionsDropdown'
import AddFilterDropdown from './AddFilterDropdown'
import { Badge } from '@shared/components/ui/badge'
import { Checkbox } from '@shared/components/ui/checkbox'
import DynamicIcon from './DynamicIcon'
import EmptyState from './EmptyState'
import Filter from './Filter'
import LoadingSpinner from './LoadingSpinner'
import Pagination from './Pagination'
import RowActions from './RowActions'
import TableCellImage from './TableCellImage'
import TableHeaderDropdown from './TableHeaderDropdown'
import { Input } from '@shared/components/ui/input'
import ToggleColumnDropdown from './ToggleColumnDropdown'

const Table = ({
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
    const tableInstance = useTable(resource)

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
    } = tableInstance

    const actions = useActions()
    const { performAction, performAsyncExport, toggleItem, isPerformingAction, allItemsAreSelected, selectedItems } = actions

    const tableWrapperRef = useRef(null)
    const tableContainerRef = useRef(null)
    const theadRef = useRef(null)

    function scrollToTopOfTable() {
        window.scrollTo({
            top: tableWrapperRef.current.offsetTop - 16,
            // instant to match Inertia's behavior
            behavior: 'instant',
        })
    }

    // Sticky Table Header
    const stickyHeader = useStickyHeader(
        () => tableContainerRef.current,
        () => theadRef.current,
    )

    // Sticky Columns
    const stickyColumns = useStickyColumns(() => tableContainerRef.current)

    useEffect(() => {
        if (!tableContainerRef.current) {
            return
        }

        stickyColumns.add()
        const cleanup = [stickyColumns.remove]

        if (resource.stickyHeader) {
            stickyHeader.add()
            cleanup.push(stickyHeader.remove)
        }

        return () => cleanup.forEach((callback) => callback())
    }, [])

    function unstick(column) {
        undoSticky(column)
        tableContainerRef.current.scrollLeft = 0
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
    ].join(' ')

    return (
        <div
            ref={tableWrapperRef}
            className="it-wrapper relative"
            {...(isPerformingAction ? { inert: '' } : {})}
        >
            {isPerformingAction && (loading ? loading({ table: tableInstance, actions }) : <LoadingSpinner />)}

            {resource.emptyState && (resource.emptyState !== true || emptyState) ? (
                emptyState ? (
                    emptyState({ table: tableInstance })
                ) : (
                    <EmptyState
                        {...{ ...resource.emptyState, meta: undefined }}
                        iconResolver={iconResolver ?? resolveIcon}
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
                        : (resource.hasBulkActions || resource.hasSearch || resource.hasExports || resource.hasFilters || resource.hasToggleableColumns) && (
                              <div className="it-topbar flex flex-col justify-between md:flex-row md:items-center md:space-x-4 rtl:md:space-x-reverse">
                                  {resource.hasSearch && (
                                      <Input
                                          value={state.search ?? ''}
                                          onChange={(e) => setSearch(e.target.value)}
                                          className="w-full md:max-w-md"
                                          autoFocus={resource.autofocus === 'search'}
                                          placeholder={trans('search_placeholder')}
                                      />
                                  )}

                                  <div className="mt-4 flex gap-4 md:mt-0">
                                      {(resource.hasBulkActions || resource.hasExports) && (
                                          <ActionsDropdown
                                              actions={resource.actions}
                                              exports={resource.exports}
                                              selectedItems={selectedItems}
                                              performAction={performAction}
                                              performAsyncExport={performAsyncExport}
                                              iconResolver={iconResolver ?? resolveIcon}
                                              onSuccess={onActionSuccess}
                                              onError={onActionError}
                                              onHandle={onCustomAction}
                                          />
                                      )}

                                      {resource.hasFilters && (
                                          <AddFilterDropdown
                                              state={state.filters}
                                              filters={resource.filters}
                                              onAdd={addFilter}
                                          />
                                      )}

                                      {resource.hasToggleableColumns && (
                                          <ToggleColumnDropdown
                                              state={state.columns}
                                              columns={resource.columns}
                                              onToggle={toggleColumn}
                                          />
                                      )}
                                  </div>
                              </div>
                          )}

                    {/* Filters */}
                    {filters
                        ? filters({ table: tableInstance, actions })
                        : hasFilters && (
                              <div className="it-filters flex flex-wrap items-center space-x-2 space-y-2 md:space-x-4 md:space-y-0  rtl:space-x-reverse">
                                  {Object.entries(resource.filters).map(
                                      ([key, filter]) =>
                                          state.filters[filter.attribute].enabled && (
                                              <Filter
                                                  key={key}
                                                  value={state.filters[filter.attribute]}
                                                  onChange={(newState) => setFilter(filter, newState.clause, newState.value)}
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
                                <table className="it-table w-full caption-bottom text-left transition-opacity dark:text-zinc-300">
                                    {thead ? (
                                        thead({ table: tableInstance, actions })
                                    ) : resource.results.data.length ? (
                                        <thead
                                            ref={theadRef}
                                            className="it-table-head relative z-20 opacity-100 transition !duration-100 ease-out group-data-[scroll-y]/table:translate-y-[var(--header-offset)] group-data-[is-scrolling-y]/table:group-data-[scroll-y]/table:opacity-0 group-data-[scroll-y]/table:shadow-lg"
                                        >
                                            <tr className="group border-b border-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                                                {hasSelectableRows && (
                                                    <th
                                                        data-column="_checkbox"
                                                        className={clsx('w-8 px-2 align-middle group-hover:bg-gray-100/50 dark:group-hover:bg-zinc-900/50', {
                                                            'left-0 z-10 bg-white/90 group-data-[scroll-x]/table:sticky rtl:right-0 dark:bg-zinc-900/90':
                                                                hasStickyColumns,
                                                        })}
                                                    >
                                                        <Checkbox
                                                            checked={allItemsAreSelected}
                                                            className="it-toggle-all-checkbox"
                                                            onCheckedChange={() => toggleItem('*')}
                                                        />
                                                    </th>
                                                )}

                                                {resource.columns
                                                    .filter((column) => state.columns[column.attribute])
                                                    .map((column) => (
                                                        <th
                                                            key={column.attribute}
                                                            data-column={column.attribute}
                                                            className={clsx(
                                                                'h-10 px-2 align-middle text-sm font-medium text-gray-500 first:ps-4 group-hover:bg-gray-100/50 dark:text-zinc-400 dark:group-hover:bg-zinc-900/50',
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
                                                                    'justify-start': column.alignment === 'left',
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
                                                        </th>
                                                    ))}
                                            </tr>
                                        </thead>
                                    ) : null}

                                    {tbody ? (
                                        tbody({ table: tableInstance, actions })
                                    ) : (
                                        <tbody className="it-table-body [&_tr:last-child]:border-0">
                                            {!resource.results.data.length ? (
                                                <tr>
                                                    <td>
                                                        <p className="p-8 text-center font-medium text-gray-900 dark:text-zinc-200">
                                                            {trans('no_results_found')}
                                                        </p>
                                                    </td>
                                                </tr>
                                            ) : null}
                                            {resource.results.data.map((item, itemIndex) => (
                                                <tr
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
                                                        <td
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
                                                                    selectedItems.includes(item._primary_key) || (item._is_selectable && allItemsAreSelected)
                                                                }
                                                                className="it-toggle-item-checkbox"
                                                                onCheckedChange={() => toggleItem(item._primary_key)}
                                                            />
                                                        </td>
                                                    )}

                                                    {resource.columns
                                                        .filter((column) => state.columns[column.attribute])
                                                        .map((column) => (
                                                            <td
                                                                key={column.attribute}
                                                                data-column={column.attribute}
                                                                className={clsx(
                                                                    'whitespace-pre p-2 align-middle transition-colors duration-150 first:ps-4 group-hover:bg-gray-50/90 group-data-[state=selected]:bg-gray-100/90 dark:text-zinc-300 group-hover:dark:bg-zinc-950/90 group-data-[state=selected]:dark:bg-zinc-800/90',
                                                                    {
                                                                        'cursor-pointer': onRowClick || getClickableColumn(column, item),
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
                                                                onClick={() =>
                                                                    column.attribute != '_actions' &&
                                                                    (onRowClick ? onRowClick(item, column) : visitUrl(getClickableColumn(column, item)))
                                                                }
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
                                                                            iconResolver={iconResolver ?? resolveIcon}
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
                                                                                    iconResolver={iconResolver ?? resolveIcon}
                                                                                    item={item}
                                                                                    actions={resource.actions}
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
                                                                                        item[column.attribute]?.variant === 'danger' ? 'destructive' :
                                                                                        item[column.attribute]?.variant === 'info' ? 'default' :
                                                                                        item[column.attribute]?.variant === 'success' ? 'secondary' :
                                                                                        item[column.attribute]?.variant === 'warning' ? 'outline' :
                                                                                        'outline'
                                                                                    }
                                                                                    className="it-badge gap-1"
                                                                                    data-style={item[column.attribute]?.variant}
                                                                                    data-variant={item[column.attribute]?.variant}
                                                                                >
                                                                                    {item[column.attribute]?.icon && (
                                                                                        <DynamicIcon
                                                                                            resolver={iconResolver ?? resolveIcon}
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
                                                                                    style={column.truncate ? { '--line-clamp': column.truncate } : {}}
                                                                                >
                                                                                    {item[column.attribute].map((value, index) => (
                                                                                        <li key={index}>{value}</li>
                                                                                    ))}
                                                                                </ul>
                                                                            ) : (
                                                                                <span
                                                                                    className={clsx({
                                                                                        'line-clamp-[--line-clamp]': !!column.truncate,
                                                                                        [column.cellClass]: !!column.cellClass,
                                                                                    })}
                                                                                    style={column.truncate ? { '--line-clamp': column.truncate } : {}}
                                                                                >
                                                                                    {item[column.attribute]}
                                                                                </span>
                                                                            )}
                                                                        </TableCellImage>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    )}
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Table Footer */}
                    {footer
                        ? footer({ table: tableInstance, actions })
                        : (hasSelectableRows || resource.pagination) && (
                              <div
                                  className={clsx('flex flex-col justify-between px-2 text-sm md:flex-row md:items-center dark:text-zinc-300', {
                                      'md:justify-end': !hasSelectableRows,
                                  })}
                              >
                                  {hasSelectableRows && (
                                      <div className="mb-1 flex-1 font-medium md:mb-0 md:w-auto">
                                          {allItemsAreSelected && resource.results.total === 1 ? (
                                              <p>{trans('one_row_selected')}</p>
                                          ) : allItemsAreSelected ? (
                                              <p>{trans('all_rows_selected', { total: resource.results.total })}</p>
                                          ) : selectedItems.length === 1 ? (
                                              <p>{trans('one_row_selected')}</p>
                                          ) : selectedItems.length > 0 ? (
                                              <p>{trans('selected_rows', { count: selectedItems.length, total: resource.results.total })}</p>
                                          ) : (
                                              <p>{trans('no_rows_selected')}</p>
                                          )}
                                      </div>
                                  )}

                                  {resource.pagination && (
                                      <Pagination
                                          meta={resource.results}
                                          type={resource.paginationType}
                                          options={resource.perPageOptions}
                                          perPage={state.perPage}
                                          onClick={(event) => visitPaginationUrl(event, scrollToTopOfTable)}
                                          onChange={setPerPage}
                                      />
                                  )}
                              </div>
                          )}
                </fieldset>
            )}
        </div>
    )
}

export default Table
