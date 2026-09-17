type AssetSelectionItem = string | number | { id: string | number };

/** Keep the first occurrence so gallery order survives reopening the picker. */
export function uniqueAssetIds(items: readonly AssetSelectionItem[]): string[] {
    return [...new Set(items.map((item) => String(typeof item === 'object' ? item.id : item)).filter(Boolean))];
}

export function includeAsset(selection: readonly AssetSelectionItem[], id: string, maxFiles = 0): string[] {
    const ids = uniqueAssetIds(maxFiles === 1 ? [id] : [...selection, id]);
    return maxFiles > 0 ? ids.slice(0, maxFiles) : ids;
}

/** Selection scope is the current page/search results, never hidden files or folders. */
export function visibleSelectionState(selection: readonly string[], visibleIds: readonly string[]): boolean | 'mixed' {
    const selected = new Set(selection);
    const count = visibleIds.filter((id) => selected.has(id)).length;
    if (count === 0) return false;
    return count === visibleIds.length ? true : 'mixed';
}

export function toggleVisibleAssets(selection: readonly string[], visibleIds: readonly string[], maxFiles = 0): string[] {
    if (visibleSelectionState(selection, visibleIds) === true) {
        const visible = new Set(visibleIds);
        return selection.filter((id) => !visible.has(id));
    }
    const existing = uniqueAssetIds(selection);
    const additions = uniqueAssetIds(visibleIds).filter((id) => !existing.includes(id));
    const available = maxFiles > 0 ? Math.max(0, maxFiles - existing.length) : additions.length;
    return [...existing, ...additions.slice(0, available)];
}
