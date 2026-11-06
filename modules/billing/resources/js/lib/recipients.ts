export function parseRecipients(value: string): string[] {
    const emails = value
        .replace(/[^,;\n<>]*<([^<>]+)>/g, '$1')
        .split(/[\s,;]+/)
        .map((email) => email.trim())
        .filter(Boolean);
    return [...new Map(emails.map((email) => [email.toLowerCase(), email])).values()];
}

export function validEmail(value: string): boolean {
    return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}
