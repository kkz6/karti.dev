// Component-specific types for the table module
import { LucideIcon } from 'lucide-react';
import type { Action } from './index';

// Component Props Types
export interface TableProps<T = any> {
    resource: any;
    iconResolver?: ((iconName: string) => LucideIcon | string | null) | null;
    loading?: boolean | null;
    topbar?: any;
    filters?: any;
    table?: any;
    thead?: any;
    tbody?: any;
    footer?: any;
    emptyState?: any;
    header?: Record<string, any>;
    cell?: Record<string, any>;
    onRowClick?: ((item: T, column: any) => void) | null;
    onActionSuccess?: ((action: Action, keys: (string | number)[]) => void) | null;
    onActionError?: ((action: Action, keys: (string | number)[], error: unknown) => void) | null;
    onCustomAction?: ((action: Action, items: (string | number)[], onFinish?: () => void) => void) | null;
    image?: Record<string, any>;
    imageFallback?: Record<string, any>;
}

export interface DropdownProps {
    children: React.ReactNode;
    className?: string;
    align?: 'left' | 'right';
}

export interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
}

export interface CheckboxProps {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}
