import { replaceUrl } from './urlHelpers'
import { router, usePage } from '@inertiajs/react'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import qs from 'qs'

export const useTable = (resource) => {
    const [state, setState] = useState(resource.state)
    const [isNavigating, setIsNavigating] = useState(false)

    const [preventNavigation, setPreventNavigation] = useState(false)
    const [clientSideVisit, setClientSideVisit] = useState(false)
    const [debounceOnNextVisit, setDebounceOnNextVisit] = useState(true)
    const [debounceTimeoutId, setDebounceTimeoutId] = useState(null)

    const page = usePage()

    const resourceKey = useMemo(() => {
        const pageProps = page.props
        return Object.keys(pageProps).find(
            (key) =>
                pageProps[key] &&
                pageProps[key].columns &&
                pageProps[key].filters &&
                pageProps[key].results &&
                pageProps[key].state &&
                pageProps[key].name === resource.name,
        )
    }, [page.props, resource.name])

    const getResourceFromPage = () => {
        return page.props[resourceKey]
    }

    const getFilterByAttribute = (attribute) => {
        return resource.filters.find((filter) => filter.attribute === attribute)
    }

    const navigate = () => {
        const newState = {
            columns: [],
            filters: {},
            perPage: null,
            search: state.search ? state.search : null,
            sort: null,
            sticky: state.sticky.length > 0 ? state.sticky : null,
        }

        if ('page' in state) {
            newState.page = state['page']
        }

        if ('cursor' in state) {
            newState.cursor = state['cursor']
        }

        if (state.sort && state.sort !== resource.defaultSort) {
            newState.sort = state.sort
        }

        if (state.perPage !== getResourceFromPage()?.state.perPage) {
            // For cursor and simple pagination, reset the page or cursor when changing the 'perPage'
            // as we can't guarantee that the current page or cursor will be valid with the new perPage value.
            // For full pagination, the 'ensureNotFurtherThanLastPage' function will take care of this.
            if (resource.paginationType === 'cursor') {
                newState.cursor = null
            } else if (resource.paginationType === 'simple') {
                newState.page = 1
            }
        }

        if (state.perPage !== resource.defaultPerPage) {
            // Only add perPage to the query string if it's different from the default
            newState.perPage = state.perPage
        }

        const clausesWithoutValue = ['is_true', 'is_false', 'is_set', 'is_not_set']

        Object.entries(state.filters).forEach(([key, filter]) => {
            // Only add filters to the query string if they're enabled
            if (!filter.enabled) {
                if (getFilterByAttribute(key)?.hasDefaultValue) {
                    newState.filters[key] = {
                        enabled: false,
                    }
                }

                return
            }

            if (!clausesWithoutValue.includes(filter.clause) && (filter.value === null || filter.value === '')) {
                return
            }

            newState.filters[key] = {
                clause: filter.clause,
                value: filter.value,
            }
        })

        const enabledColumns = Object.entries(state.columns)
            .filter(([, enabled]) => enabled)
            .map(([column]) => column)

        const defaultVisibleColumns = resource.columns.filter((column) => column.visibleByDefault).map((column) => column.attribute)

        if (enabledColumns.sort().toString() !== defaultVisibleColumns.sort().toString()) {
            // Only add columns to the query string if they're different from the default
            newState.columns = enabledColumns
        }

        // If the resource name is not 'default', we wrap the state in an object with the name as the key
        const tableQueryString = resource.name === 'default' ? newState : { [resource.name]: newState }

        // Merge the current query string with the new table query string
        const currentQueryString = qs.parse(window.location.search, { ignoreQueryPrefix: true })

        const params = {
            ...currentQueryString,
            ...tableQueryString,
        }

        //
        if (resource.name === 'default') {
            if ('page' in params && params.page < 2) {
                delete params.page
            }

            if ('cursor' in params && !params.cursor) {
                delete params.cursor
            }
        } else {
            if ('page' in params[resource.name] && params[resource.name].page < 2) {
                delete params[resource.name].page
            }

            if ('cursor' in params[resource.name] && !params[resource.name].cursor) {
                delete params[resource.name].cursor
            }
        }

        const queryString = qs.stringify(params, { skipNulls: true })

        visitTableUrl(window.location.pathname + (queryString ? `?${queryString}` : ''))
    }

    const ensureNotFurtherThanLastPage = () => {
        if (!isNavigating) {
            const currentResource = getResourceFromPage()

            if (
                currentResource?.results &&
                currentResource.paginationType === 'full' &&
                currentResource.results.current_page > currentResource.results.last_page
            ) {
                visitPaginationUrl(currentResource.results.last_page_url)
            }
        }
    }

    useEffect(() => {
        ensureNotFurtherThanLastPage()
    }, [page.props])

    function setValueOfFilter(attribute, value) {
        if (state.filters[attribute].value === value) {
            return
        }

        setState(function (prev) {
            const newState = {
                ...prev,
                filters: {
                    ...prev.filters,
                    [attribute]: { ...prev.filters[attribute], value },
                },
            }

            return newState
        })
    }

    const isFirstRender = useRef(true)

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }

        let valueReset = false

        Object.entries(state.filters).forEach(([key, filter]) => {
            if (!filter.enabled) {
                return
            }

            if (['is_set', 'is_not_set'].includes(filter.clause)) {
                if (filter.value) {
                    setValueOfFilter(key, null)
                    valueReset = true
                }
            } else if (['in', 'not_in', 'between', 'not_between'].includes(filter.clause)) {
                if (!Array.isArray(filter.value)) {
                    const filterType = getFilterByAttribute(key)?.type
                    let newValue = null

                    if (filterType === 'numeric') {
                        newValue = [null, null]
                    } else if (filterType === 'set') {
                        newValue = []
                    }

                    setValueOfFilter(key, newValue)
                    valueReset = true
                }
            } else {
                if (Array.isArray(filter.value) && !getFilterByAttribute(key)?.multiple) {
                    setValueOfFilter(key, null)
                    valueReset = true
                }
            }
        })

        if (valueReset) {
            setPreventNavigation(false)
            setDebounceOnNextVisit(true)
            return
        }

        if (preventNavigation) {
            setPreventNavigation(false)
            return
        }

        if (clientSideVisit) {
            return navigate()
        }

        setIsNavigating(true)

        clearTimeout(debounceTimeoutId)
        setDebounceTimeoutId(null)

        if (!debounceOnNextVisit) {
            return navigate()
        }

        setDebounceTimeoutId(setTimeout(navigate, resource.debounceTime))
    }, [state])

    const setPerPage = (perPage) => {
        setDebounceOnNextVisit(false)
        setState((prev) => ({ ...prev, perPage: parseInt(perPage) }))
    }

    const setSort = (sort) => {
        setDebounceOnNextVisit(false)
        setState((prev) => ({ ...prev, sort: sort === resource.defaultSort ? null : sort }))
    }

    const makeSticky = (column) => {
        let reachedColumn = false
        const sticky = []

        Object.entries(state.columns).forEach(([key, enabled]) => {
            if (!enabled || reachedColumn) {
                return
            }

            setClientSideVisit(true)
            sticky.push(key)

            if (key === column.attribute) {
                reachedColumn = true
            }
        })

        setState((prev) => ({ ...prev, sticky }))
    }

    const undoSticky = (column) => {
        const index = state.sticky.indexOf(column.attribute)

        if (index === -1) {
            return
        }

        setClientSideVisit(true)
        setState((prev) => ({ ...prev, sticky: state.sticky.slice(0, index) }))
    }

    const sortByColumn = (column) => {
        if (!column.sortable) {
            return
        }

        if (state.sort === column.attribute) {
            setSort(`-${column.attribute}`)
        } else if (state.sort === `-${column.attribute}`) {
            setSort(null)
        } else if (state.sort === null && column.attribute === resource.defaultSort) {
            setSort(resource.defaultSort.startsWith('-') ? resource.defaultSort.slice(1) : `-${resource.defaultSort}`)
        } else {
            setSort(column.attribute)
        }
    }

    const isSortedByColumn = useCallback(
        (column) => {
            if (state.sort === column.attribute || (!state.sort && resource.defaultSort === column.attribute)) {
                return 'asc'
            }
            if (state.sort === `-${column.attribute}` || (!state.sort && resource.defaultSort === `-${column.attribute}`)) {
                return 'desc'
            }
            return false
        },
        [state.sort, resource.defaultSort],
    )

    let cancelToken = null

    const visitPaginationUrl = (url, scrollToTopOfTable) => {
        const scrollPosition = resource.scrollPositionAfterPageChange

        visitTableUrl(url, {
            preserveScroll: ['preserve', 'topOfTable'].includes(scrollPosition),
            onFinish: scrollPosition === 'topOfTable' ? () => scrollToTopOfTable() : null,
        })
    }

    const visitTableUrl = (url, optionsOrPreserveScroll = true) => {
        if (url === window.location.pathname + window.location.search) {
            setIsNavigating(false)
            return
        }

        if (clientSideVisit) {
            setClientSideVisit(false)

            return replaceUrl(url)
        }

        setIsNavigating(true)

        // optionsOrPreserveScroll can be a boolean or an object, for legacy reasons
        const customOptions = typeof optionsOrPreserveScroll === 'boolean' ? {} : optionsOrPreserveScroll

        const reloadAllProps = resource.reloadProps.length === 1 && resource.reloadProps[0] === '*'

        router.visit(url, {
            preserveState: true,
            preserveScroll: typeof optionsOrPreserveScroll === 'boolean' ? optionsOrPreserveScroll : true,
            ...(reloadAllProps ? {} : { only: [...resource.reloadProps, resourceKey] }),
            ...customOptions,
            onBefore: () => {
                cancelToken?.cancel()
                cancelToken = null
                customOptions.onBefore?.()
            },
            onCancelToken: (token) => {
                cancelToken = token
                customOptions.onCancelToken?.()
            },
            onFinish: () => {
                setIsNavigating(false)
                setDebounceOnNextVisit(true)
                customOptions.onFinish?.()
            },
        })
    }

    const addFilter = (filter) => {
        if (filter.type !== 'boolean') {
            setPreventNavigation(true)
        }

        setState((prev) => ({
            ...prev,
            filters: {
                ...prev.filters,
                [filter.attribute]: { ...prev.filters[filter.attribute], enabled: true, new: true },
            },
        }))
    }

    const removeFilter = (column) => {
        setDebounceOnNextVisit(false)
        setState((prev) => ({
            ...prev,
            filters: {
                ...prev.filters,
                [column.attribute]: { ...prev.filters[column.attribute], enabled: false, value: null },
            },
        }))
    }

    const toggleColumn = (column) => {
        setDebounceOnNextVisit(false)
        setState((prev) => ({
            ...prev,
            columns: {
                ...prev.columns,
                [column.attribute]: !prev.columns[column.attribute],
            },
        }))
    }

    const hasBulkActions = useMemo(() => {
        return resource.hasBulkActions
    }, [resource.hasBulkActions])

    const hasExports = useMemo(() => {
        return resource.hasExports
    }, [resource.hasExports])

    const hasSelectableRows = useMemo(() => {
        return resource.hasBulkActions || resource.hasExportsThatLimitsToSelectedRows
    }, [resource.hasExports, resource.hasExportsThatLimitsToSelectedRows])

    const hasStickyColumns = useMemo(() => {
        return state.sticky.length > 0
    }, [state.sticky])

    const hasFilters = useMemo(() => {
        return Object.values(state.filters).some((filter) => filter.enabled)
    }, [state.filters])

    const setSearch = (search) => {
        setState((prev) => ({ ...prev, search }))
    }

    const setFilter = (filter, clause, value) => {
        setState((prev) => ({
            ...prev,
            filters: {
                ...prev.filters,
                [filter.attribute]: {
                    ...prev.filters[filter.attribute],
                    clause,
                    value,
                },
            },
        }))
    }

    return {
        addFilter,
        hasBulkActions,
        hasExports,
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
        sortByColumn,
        state,
        toggleColumn,
        undoSticky,
        visitPaginationUrl,
        visitTableUrl,
    }
}
