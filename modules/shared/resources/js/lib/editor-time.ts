export type TimePart = 'hour' | 'minute' | 'period';

/** Change local wall-clock time without mutating the form's Date value. */
export function setEditorTime(date: Date, part: TimePart, value: string): Date {
    const next = new Date(date);
    if (part === 'hour') {
        next.setHours((Number(value) % 12) + (date.getHours() >= 12 ? 12 : 0));
    } else if (part === 'minute') {
        next.setMinutes(Number(value));
    } else {
        next.setHours((date.getHours() % 12) + (value === 'PM' ? 12 : 0));
    }
    next.setSeconds(0, 0);
    return next;
}
