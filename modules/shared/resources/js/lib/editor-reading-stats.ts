/** A lightweight, approximate reading-time indicator based on the editor's plain text. */
export function getEditorReadingStats(text: string) {
    const words = text.trim().match(/\S+/gu)?.length ?? 0;
    const seconds = Math.ceil((words / 200) * 60);
    return { words, readingTime: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` };
}
