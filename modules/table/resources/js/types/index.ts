import { LucideIcon } from 'lucide-react';

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
    sortable?: boolean;
    searchable?: boolean;
    clickable?: boolean;
    hidden?: boolean;
    sticky?: boolean;
    width?: string | number;
    className?: string;
    [key: string]: any;
}

export interface TableResource<T = any> {
    results?: {
        total: number;
        data: T[];
        per_page?: number;
        current_page?: number;
        last_page?: number;
    };
    state: {
        search?: string;
        filters: Record<string, FilterState>;
        sort?: {
            column: string;
            direction: 'asc' | 'desc';
        };
        page?: number;
        perPage?: number;
    };
    columns: TableColumn[];
    actions?: Action[];
    [key: string]: any;
}

export interface TableConfig<T = any> extends TableResource<T> {}

// Dynamic Icon Types
export interface DynamicIconProps {
    icon: string | LucideIcon;
    resolver?: ((iconName: string) => LucideIcon | string | null) | null;
    context?: any;
    className?: string;
}

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

export interface FilterProps {
    column: TableColumn;
    state: FilterState;
    options?: FilterOption[];
    onChange: (value: any, clause?: string) => void;
    onRemove: () => void;
}

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
