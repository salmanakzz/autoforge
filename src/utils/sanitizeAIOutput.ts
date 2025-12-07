export function sanitizeAIOutput(text: string): string {
    return text
        .replace(/`+/g, "") // remove backticks
        .replace(/["']/g, "") // remove quotes
        .trim();
}
