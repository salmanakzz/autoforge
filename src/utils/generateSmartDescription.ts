export function generateSmartDescription(diff: string): string {
    const addedLines = diff.match(/^\+\s*(?!\+\+)/gm)?.length || 0;
    const removedLines = diff.match(/^\-\s*(?!--)/gm)?.length || 0;

    const lower = diff.toLowerCase();

    // Detect higher-level meaning
    const keywords: string[] = [];

    if (/function\s+([a-zA-Z0-9_]+)/.test(diff)) {
        const fn = diff.match(/function\s+([a-zA-Z0-9_]+)/)?.[1];
        if (fn) {
            keywords.push(`update ${fn} logic`);
        }
    }

    if (/class\s+([A-Za-z0-9_]+)/.test(diff)) {
        const cls = diff.match(/class\s+([A-Za-z0-9_]+)/)?.[1];
        if (cls) {
            keywords.push(`modify ${cls} class`);
        }
    }

    if (/import\s+|require\s*\(/.test(diff)) {
        keywords.push("manage dependencies");
    }

    if (/console\.log/.test(diff)) {
        keywords.push("adjust debugging output");
    }

    if (/config|env|setting/.test(lower)) {
        keywords.push("update configuration");
    }

    if (/route|controller|api|endpoint/.test(lower)) {
        keywords.push("update api logic");
    }

    if (/schema|model|db|query/.test(lower)) {
        keywords.push("update database logic");
    }

    // If keywords found -> join them
    if (keywords.length > 0) {
        return keywords.join(", ");
    }

    // Fallback (based on lines added/removed)
    if (addedLines && removedLines) {
        return "update logic";
    }
    if (addedLines) {
        return "add new code";
    }
    if (removedLines) {
        return "remove unused code";
    }

    return "modify files";
}
