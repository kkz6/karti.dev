import type { ClauseSymbols, ClauseType } from './types';

// Simple clause symbols for table filters
let clauseSymbols: ClauseSymbols = {
    // Basic equality
    equals: '=',
    not_equals: '≠',

    // Text operations
    contains: '∼',
    not_contains: '≁',
    starts_with: '↪',
    not_starts_with: '↫',
    ends_with: '↩',
    not_ends_with: '↬',

    // Numeric comparisons
    greater_than: '>',
    greater_than_or_equal: '≥',
    less_than: '<',
    less_than_or_equal: '≤',
    between: '⇔',
    not_between: '⇎',

    // Set operations
    in: '∈',
    not_in: '∉',

    // Null checks
    is_null: '∅',
    is_not_null: '≠∅',
    is_set: '✓',
    is_not_set: '✗',

    // Boolean
    is_true: '✓',
    is_false: '✗',

    // Date operations
    before: '◀',
    equal_or_before: '≤',
    after: '▶',
    equal_or_after: '≥',

    // Legacy mappings (for backward compatibility)
    '=': '=',
    '!=': '≠',
    '>': '>',
    '>=': '≥',
    '<': '<',
    '<=': '≤',
    like: '∼',
    not_like: '≁',
};

export const getSymbolForClause = (clause: ClauseType | string): string => {
    return clauseSymbols[clause as ClauseType] || clause;
};

export const setClauseSymbols = (symbols: Partial<ClauseSymbols>): void => {
    clauseSymbols = { ...clauseSymbols, ...symbols };
};
