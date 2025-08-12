// Simple clause symbols for table filters
let clauseSymbols = {
    'equals': '=',
    'not_equals': '≠',

    // Text operations
    'contains': '∼',
    'not_contains': '≁',
    'starts_with': '↪',
    'not_starts_with': '↫',
    'ends_with': '↩',
    'not_ends_with': '↬',

    // Numeric comparisons
    'greater_than': '>',
    'greater_than_or_equal': '≥',
    'less_than': '<',
    'less_than_or_equal': '≤',
    'between': '⇔',
    'not_between': '⇎',

    // Set operations
    'in': '∈',
    'not_in': '∉',

    // Null checks
    'is_null': '∅',
    'is_not_null': '≠∅',
    'is_set': '✓',
    'is_not_set': '✗',

    // Boolean
    'is_true': '✓',
    'is_false': '✗',

    // Date operations
    'before': '◀',
    'equal_or_before': '≤',
    'after': '▶',
    'equal_or_after': '≥',

    '=': '=',
    '!=': '≠',
    '>': '>',
    '>=': '≥',
    '<': '<',
    '<=': '≤',
    'like': '∼',
    'not_like': '≁',
    'in': '∈',
    'not_in': '∉',
    'between': '⇔',
    'not_between': '⇎',
    'is_null': '∅',
    'is_not_null': '≠∅'
};

export const getSymbolForClause = (clause) => {
    return clauseSymbols[clause] || clause;
};

export const setClauseSymbols = (symbols) => {
    clauseSymbols = { ...clauseSymbols, ...symbols };
};
