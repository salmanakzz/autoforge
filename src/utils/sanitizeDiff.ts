const SENSITIVE_FILE_PATTERNS = [
    /\.env(\.\w+)?$/,
    /.*secret.*/i,
    /.*credential.*/i,
    /.*private.*/i,
    /.*password.*/i,
    /\.pem$/,
    /\.key$/,
    /\.p12$/,
    /\.pfx$/,
    /\.cer$/,
    /\.crt$/,
    /id_rsa/,
    /id_ed25519/,
    /\.npmrc$/,
    /\.netrc$/,
    /.*keystore.*/i,
];

const SENSITIVE_VALUE_PATTERNS = [
    // Generic key=value
    /^(\+|-)\s*.*(api_key|apikey|api_token|access_token|secret|password|passwd|pwd|private_key|auth_token|bearer|client_secret)\s*=\s*.+$/im,
    // Bearer tokens in code
    /^(\+|-)\s*.*bearer\s+[a-zA-Z0-9\-._~+/]+=*/im,
    // AWS keys
    /^(\+|-)\s*.*(AKIA[0-9A-Z]{16}).*/im,
    // Generic long hex/base64 secrets
    /^(\+|-)\s*.*=\s*["']?[A-Za-z0-9._\-+/=]{32,}["']?.*$/im,
];

function isSensitiveFile(filePath: string): boolean {
    return SENSITIVE_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function hasSensitiveValue(line: string): boolean {
    return SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(line));
}

interface SanitizeResult {
    sanitized: string;
    sensitiveFileDetected: boolean;
}

export function sanitizeDiff(prompt: string): SanitizeResult {
    const fileBlocks = prompt.split(/(?=diff --git )/);
    let sensitiveFileDetected = false;

    const sanitizedBlocks = fileBlocks
        .map((block) => {
            if (!block.trim()) {
                return null;
            }

            const filePathMatch = block.match(
                /diff --git a\/(.+?) b\/(.+?)(\n|$)/,
            );
            if (!filePathMatch) {
                return block;
            }

            const filePath = filePathMatch[2];

            if (isSensitiveFile(filePath)) {
                sensitiveFileDetected = true;
                return `diff --git a/${filePath} b/${filePath}\n[REDACTED - sensitive file omitted]\n`;
            }

            const lines = block.split("\n");
            const sanitizedLines = lines.map((line) => {
                if (hasSensitiveValue(line)) {
                    sensitiveFileDetected = true;
                    return line.replace(/=\s*["']?.+["']?$/, "=[REDACTED]");
                }
                return line;
            });

            return sanitizedLines.join("\n");
        })
        .filter((block): block is string => block !== null);

    return {
        sanitized: sanitizedBlocks.join(""),
        sensitiveFileDetected,
    };
}
export function isEmptyDiff(prompt: string): boolean {
    return prompt
        .split(/(?=diff --git )/)
        .filter((block) => block.trim())
        .every((block) =>
            block.includes("[REDACTED - sensitive file omitted]"),
        );
}
