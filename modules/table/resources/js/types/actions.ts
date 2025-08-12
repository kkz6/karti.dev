// Action-specific types for table operations
import type { Action } from './index';

// Extended action interface for table operations
export interface TableAction extends Omit<Action, 'url'> {
    url: string;
    authorized: boolean;
    isCustom?: boolean;
    limitToSelectedRows?: boolean;
}

// Export-specific interface
export interface TableExport {
    url: string;
    limitToSelectedRows?: boolean;
    [key: string]: any;
}

// Action performance result types
export interface ActionSuccessResult {
    keys: (string | number)[];
    response: any;
}

export interface ActionErrorResult {
    keys: (string | number)[];
    error: any;
}

export interface CustomActionResult {
    keys: (string | number)[];
    onFinish: () => void;
}

// Export performance result types
export interface ExportSuccessResult {
    keys: (string | number)[];
    response: any;
}

export interface ExportErrorResult {
    keys: (string | number)[];
    error: any;
}

// Hook return type
export interface UseActionsReturn {
    allItemsAreSelected: boolean;
    isPerformingAction: boolean;
    performAction: (action: TableAction, keys?: (string | number)[] | null) => Promise<ActionSuccessResult | CustomActionResult>;
    performAsyncExport: (tableExport: TableExport) => Promise<ExportSuccessResult>;
    selectedItems: (string | number)[];
    toggleItem: (id: string | number | '*') => void;
}

// Action types for different operations
export type ActionResult = ActionSuccessResult | ActionErrorResult | CustomActionResult;
export type ExportResult = ExportSuccessResult | ExportErrorResult;
