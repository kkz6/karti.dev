// Simple clause symbols for table filters
let clauseSymbols = {
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
