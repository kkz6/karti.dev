type AssetSelectionItem = string | number | { id: string | number };

/** Keep the first occurrence so gallery order survives reopening the picker. */
export function uniqueAssetIds(items: readonly AssetSelectionItem[]): string[] {
    return [...new Set(items.map((item) => String(typeof item === 'object' ? item.id : item)).filter(Boolean))];
}

export function includeAsset(selection: readonly AssetSelectionItem[], id: string, maxFiles = 0): string[] {
    const ids = uniqueAssetIds(maxFiles === 1 ? [id] : [...selection, id]);
    return maxFiles > 0 ? ids.slice(0, maxFiles) : ids;
}
