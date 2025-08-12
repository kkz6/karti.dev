import { LucideIcon } from 'lucide-react';

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
