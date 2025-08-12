// Simple translation system for table module
let translations = {
    'All': 'All',
    'Search': 'Search',
    'Filter': 'Filter',
    'Actions': 'Actions',
    'No results found': 'No results found',
    'Showing': 'Showing',
    'to': 'to',
    'of': 'of',
    'results': 'results',
    'Previous': 'Previous',
    'Next': 'Next',
};

export const trans = (key, replacements = {}) => {
    let translation = translations[key] || key;

    // Simple replacement logic
    Object.keys(replacements).forEach(placeholder => {
        translation = translation.replace(`:${placeholder}`, replacements[placeholder]);
    });

    return translation;
};

export const setTranslations = (newTranslations) => {
    translations = { ...translations, ...newTranslations };
};
