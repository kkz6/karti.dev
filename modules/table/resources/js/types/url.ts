// URL helper types for table navigation
import type { Action } from './index';

// URL configuration for Inertia.js navigation
export interface UrlNavigationOptions {
    replace?: boolean;
    preserveScroll?: boolean;
    preserveState?: boolean;
    only?: string[];
    except?: string[];
    headers?: Record<string, string>;
    errorBag?: string;
    forceFormData?: boolean;
    queryStringArrayFormat?: 'brackets' | 'indices';
}

// Modal callback type
export type ModalCallback = (url: string) => void | Promise<void>;

// URL function type for columns
export type ColumnUrlFunction<T = any> = (item: T) => string | null;

// Column with URL properties
export interface ClickableColumn {
    attribute: string;
    url?: string | ColumnUrlFunction;
    clickable?: boolean;
    [key: string]: any;
}

// Table item with URL properties
export interface TableItem {
    _primary_key?: string | number;
    _row_url?: string;
    _url?: string;
    url?: string;
    _column_urls?: Record<string, string>;
    _actions?: (Action | null)[];
    [key: string]: any;
}

// Action item for matching - extended from base Action
export interface ActionItem extends Action {
    componentType?: string;
    bindings?: Record<string, any>;
    type?: 'button' | 'link';
    isVisible?: boolean;
    asDownload?: boolean;
    when?: (item: any) => boolean;
}

// URL helper function types
export type VisitUrlFunction = (url: string | null | undefined) => void;
export type VisitModalFunction = (url: string | null | undefined, modalCallback?: ModalCallback) => void;
export type ReplaceUrlFunction = (url: string | null | undefined) => void;
export type GetClickableColumnFunction = (column: ClickableColumn | null, item: TableItem | null) => string | null;
export type GetActionForItemFunction = (actionData: string | ActionItem | null, action: any) => ActionItem | null;
