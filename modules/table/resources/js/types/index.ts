import { LucideIcon } from 'lucide-react';
import { TableAction, TableExport } from './actions';
import { ActionItem } from './url';

// Re-export URL types
export * from './url';
// Re-export Action types
export * from './actions';

// URL and Navigation Types
export interface UrlConfig {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: Record<string, any>;
    headers?: Record<string, string>;
    hidden?: boolean;
    disabled?: boolean;
    asDownload?: boolean | string;
}

// Action Types
export interface Action {
    id: string;
    label: string;
    icon?: string | LucideIcon;
    url?: UrlConfig;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    buttonClass?: string;
    dataAttributes?: Record<string, any>;
    when?: (item: any) => boolean;
}

// Empty State Types
export interface EmptyStateProps {
    title?: string;
    message?: string;
    actions?: Action[];
    icon?: boolean | string | LucideIcon;
    iconResolver?: ((iconName: string) => LucideIcon | string | null) | null;
    dataAttributes?: Record<string, any>;
}

// Table Types
export interface FilterState {
    enabled: boolean;
    value?: any;
    clause?: string;
    [key: string]: any;
}

export interface TableColumn {
    attribute: string;
    label: string;
    header?: string;
    headerClass?: string;
    sortable?: boolean;
    searchable?: boolean;
    clickable?: boolean;
    hidden?: boolean;
    sticky?: boolean;
    toggleable?: boolean;
    stickable?: boolean;
    alignment?: 'left' | 'center' | 'right';
    width?: string | number;
    className?: string;
    [key: string]: any;
}

// This interface is moved to the bottom to avoid conflicts

export interface TableConfig<T = any> extends TableResource {
    results?: {
        total: number;
        data: T[];
        per_page?: number;
        current_page?: number;
        last_page?: number;
        last_page_url?: string;
        first_page_url?: string;
        prev_page_url?: string | null;
        next_page_url?: string | null;
        from?: number;
        to?: number;
        on_first_page?: boolean;
        on_last_page?: boolean;
        links?: { url: string | null; label: string; page: number | null; active: boolean }[];
    };
}

// Dynamic Icon Types (removed duplicate - using definition below)

// Pagination Types
export interface PaginationLink {
    url?: string;
    label: string;
    active: boolean;
}

export interface PaginationProps {
    links: PaginationLink[];
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    from: number;
    to: number;
}

// Filter Types
export interface FilterOption {
    label: string;
    value: any;
}

// FilterProps is now defined below with the updated Filter types

// Dynamic Icon Types
export interface DynamicIconProps {
    icon: string | null | undefined;
    resolver: ((icon: string, context?: any) => React.ComponentType<any> | null) | null;
    context?: any;
    className?: string;
}

// Icon Resolver Types
export type IconComponent = React.ComponentType<any>;
export type IconResolver = (iconName: string, context?: any) => IconComponent | null;
export type IconInput = string | IconComponent | null | undefined;

// Filter Dropdown Types
export interface FilterDefinition {
    attribute: string;
    label: string;
    type?: string;
    options?: FilterOption[];
    [key: string]: any;
}

export interface AddFilterDropdownProps {
    filters: FilterDefinition[];
    state: Record<string, FilterState>;
    onAdd: (filter: FilterDefinition) => void;
}

// Clause Types
export type ClauseType =
    // Basic equality
    | 'equals'
    | 'not_equals'
    // Text operations
    | 'contains'
    | 'not_contains'
    | 'starts_with'
    | 'not_starts_with'
    | 'ends_with'
    | 'not_ends_with'
    // Numeric comparisons
    | 'greater_than'
    | 'greater_than_or_equal'
    | 'less_than'
    | 'less_than_or_equal'
    | 'between'
    | 'not_between'
    // Set operations
    | 'in'
    | 'not_in'
    // Null checks
    | 'is_null'
    | 'is_not_null'
    | 'is_set'
    | 'is_not_set'
    // Boolean
    | 'is_true'
    | 'is_false'
    // Date operations
    | 'before'
    | 'equal_or_before'
    | 'after'
    | 'equal_or_after'
    // Legacy mappings
    | '='
    | '!='
    | '>'
    | '>='
    | '<'
    | '<='
    | 'like'
    | 'not_like';

export type ClauseSymbols = Record<ClauseType, string>;

export interface ClauseHelpers {
    getSymbolForClause: (clause: ClauseType | string) => string;
    setClauseSymbols: (symbols: Partial<ClauseSymbols>) => void;
}

// Dialog Types
export interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmButton: string;
    cancelButton?: string | false;
    show: boolean;
    danger?: boolean;
    variant?: 'danger' | 'info' | null;
    customVariantClass?: string;
    onCancel?: (() => void) | null;
    onConfirm?: (() => void) | null;
    icon?: string | null;
    iconResolver?: ((icon: string, context?: any) => React.ComponentType<any> | null) | null;
}

export interface ConfirmActionDialogProps {
    show: boolean;
    action?: {
        confirmationTitle?: string;
        confirmationMessage?: string;
        confirmationCancelButton?: string;
        confirmationConfirmButton?: string;
        icon?: string;
        variant?: 'danger' | 'info';
        buttonClass?: string;
    };
    onConfirm?: (() => void) | null;
    onCancel?: (() => void) | null;
    iconResolver?: ((icon: string, context?: any) => React.ComponentType<any> | null) | null;
}

export interface FailedActionDialogProps {
    show: boolean;
    onConfirm: () => void;
}

// Filter Types - updated FilterOption
export interface FilterOptionExtended {
    label: string;
    value: string | number;
}

export interface FilterValue {
    enabled: boolean;
    clause: string;
    value?: any;
    new?: boolean;
}

export interface FilterDefinitionExtended {
    attribute: string;
    label: string;
    type: 'text' | 'numeric' | 'date' | 'boolean' | 'set';
    clauses: string[];
    options?: FilterOptionExtended[];
    multiple?: boolean;
}

export interface FilterProps {
    filter: FilterDefinitionExtended;
    value: FilterValue;
    onChange: (value: FilterValue) => void;
    onRemove: () => void;
}

// Loading Spinner Types
export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

// Table Header Dropdown Types
export interface TableHeaderDropdownProps {
    column: TableColumn;
    sort?: string | false;
    sticky: boolean;
    onToggle: (column: TableColumn) => void;
    onSort: (sortString: string) => void;
    onStick: (column: TableColumn) => void;
    onUnstick: (column: TableColumn) => void;
}

export interface ButtonIconProps {
    sort?: string | false;
    className?: string;
}

// Toggle Column Dropdown Types
export interface ToggleColumnDropdownProps {
    columns: TableColumn[];
    state: Record<string, boolean>;
    onToggle: (column: TableColumn) => void;
}

// Sticky Table Types
export interface StickyTableHook {
    add: () => void;
    remove: () => void;
}

export type GetElementFunction = () => HTMLElement | null;

// Table Cell Image Types
export interface TableCellImageData {
    icon?: string;
    url?: string | string[];
    alt?: string;
    title?: string;
    width?: number | string;
    height?: number | string;
    size?: 'small' | 'medium' | 'large' | 'extra-large';
    rounded?: boolean;
    position?: 'start' | 'end';
    remaining?: number;
    class?: string;
}

export interface TableCellImageProps {
    data?: TableCellImageData | null;
    iconResolver?: ((icon: string) => React.ComponentType<any>) | null;
    renderDefaultSlot?: boolean;
    children?: React.ReactNode;
    fallback?: (() => React.ReactNode) | null;
    image?: (() => React.ReactNode) | null;
}

// Row Actions Types - ActionItem is defined in types/url.ts

export interface TableRowItem {
    _primary_key: string | number;
    _actions?: (string | ActionItem | null)[];
    [key: string]: any;
}

export interface RowActionsProps {
    item: TableRowItem;
    actions: TableAction[];
    performAction: (action: TableAction, keys?: (string | number)[] | null) => Promise<any>;
    iconResolver: ((icon: string) => React.ComponentType<any>) | null;
    asDropdown?: boolean;
    onSuccess?: ((action: TableAction, keys: (string | number)[]) => void) | null;
    onError?: ((action: TableAction, keys: (string | number)[], error: any) => void) | null;
    onHandle?: ((action: TableAction, keys: (string | number)[], onFinish?: () => void) => void) | null;
}

// Pagination Types
export interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    on_first_page: boolean;
    on_last_page: boolean;
    per_page: number;
    to: number;
    total: number;
    first_page_url?: string;
    prev_page_url?: string | null;
    next_page_url?: string | null;
    last_page_url?: string;
    links?: Array<{ url: string | null; label: string; page: number | null; active: boolean }>;
}

export interface TablePaginationProps {
    meta: PaginationMeta;
    options: number[];
    perPage: number;
    type?: 'full' | 'simple';
    onClick: (url: string) => void;
    onChange: (perPage: number) => void;
}

// Table Hook Types
export interface TableResource {
    name: string;
    state: TableState;
    columns: TableColumn[];
    filters: FilterDefinition[];
    actions?: TableAction[];
    exports?: TableExport[];
    results?: {
        total: number;
        data: any[];
        per_page?: number;
        current_page?: number;
        last_page?: number;
        last_page_url?: string;
        first_page_url?: string;
        prev_page_url?: string | null;
        next_page_url?: string | null;
        from?: number;
        to?: number;
        on_first_page?: boolean;
        on_last_page?: boolean;
        links?: { url: string | null; label: string; page: number | null; active: boolean }[];
    };
    defaultSort: string;
    defaultPerPage: number;
    perPageOptions?: number[];
    keyAttribute?: string;
    paginationType: 'full' | 'simple' | 'cursor';
    debounceTime: number;
    scrollPositionAfterPageChange: 'preserve' | 'topOfTable' | string;
    reloadProps: string[];
    hasBulkActions: boolean;
    hasExports: boolean;
    hasExportsThatLimitsToSelectedRows: boolean;
    hasRowActions: boolean;
    // Additional properties for UI features
    stickyHeader?: boolean;
    emptyState?: any;
    hasSearch?: boolean;
    hasFilters?: boolean;
    hasToggleableColumns?: boolean;
    autofocus?: string;
    pagination?: boolean;
}

export interface TableState {
    search: string | null;
    sort: string | null;
    perPage: number;
    page?: number;
    cursor?: string | null;
    filters: Record<string, FilterState>;
    columns: Record<string, boolean>;
    sticky: string[];
}

export interface UseTableReturn {
    addFilter: (filter: FilterDefinition) => void;
    hasBulkActions: boolean;
    hasExports: boolean;
    hasFilters: boolean;
    hasSelectableRows: boolean;
    hasStickyColumns: boolean;
    isNavigating: boolean;
    isSortedByColumn: (column: TableColumn) => 'asc' | 'desc' | false;
    makeSticky: (column: TableColumn) => void;
    removeFilter: (column: TableColumn) => void;
    setFilter: (filter: FilterDefinition, clause: string, value: any) => void;
    setPerPage: (perPage: number) => void;
    setSearch: (search: string) => void;
    setSort: (sort: string | null) => void;
    sortByColumn: (column: TableColumn) => void;
    state: TableState;
    toggleColumn: (column: TableColumn) => void;
    undoSticky: (column: TableColumn) => void;
    visitPaginationUrl: (url: string, scrollToTopOfTable?: () => void) => void;
    visitTableUrl: (url: string, optionsOrPreserveScroll?: boolean | Record<string, any>) => void;
}

// Table Component Types
export interface TableProps {
    resource: TableResource;
    iconResolver?: ((icon: string) => React.ComponentType<any>) | null;
    loading?: React.ReactNode | null;
    topbar?: React.ReactNode | null;
    filters?: React.ReactNode | null;
    table?: React.ReactNode | null;
    thead?: React.ReactNode | null;
    tbody?: React.ReactNode | null;
    footer?: React.ReactNode | null;
    emptyState?: React.ReactNode | null;
    header?: Record<string, any>;
    cell?: Record<string, any>;
    onRowClick?: ((item: any) => void) | null;
    onActionSuccess?: ((action: any, keys: any[]) => void) | null;
    onActionError?: ((action: any, keys: any[], error: any) => void) | null;
    onCustomAction?: ((action: any, keys: any[], onFinish?: () => void) => void) | null;
    image?: Record<string, any>;
    imageFallback?: Record<string, any>;
}
