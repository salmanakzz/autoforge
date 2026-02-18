import { sanitizeDiff, isEmptyDiff } from "../../utils/sanitizeDiff";

describe("sanitizeDiff", () => {
    test("should return unchanged diff when no sensitive data exists", () => {
        const diff = `
diff --git a/src/app.ts b/src/app.ts
+ const name = "test";
- const age = 10;
`;

        const result = sanitizeDiff(diff);

        expect(result.sensitiveFileDetected).toBe(false);
        expect(result.sanitized).toContain(`const name = "test"`);
    });

    test("should redact sensitive file (.env)", () => {
        const diff = `
diff --git a/.env b/.env
+ API_KEY=123456
`;

        const result = sanitizeDiff(diff);

        expect(result.sensitiveFileDetected).toBe(true);
        expect(result.sanitized).toContain(
            "[REDACTED - sensitive file omitted]",
        );
    });

    test("should redact private key files", () => {
        const diff = `
diff --git a/id_rsa b/id_rsa
+ -----BEGIN RSA PRIVATE KEY-----
`;

        const result = sanitizeDiff(diff);

        expect(result.sensitiveFileDetected).toBe(true);
        expect(result.sanitized).toContain("[REDACTED");
    });

    test("should redact api keys in code", () => {
        const diff = `
diff --git a/src/config.ts b/src/config.ts
+ const api_key = "my-super-secret-key";
`;

        const result = sanitizeDiff(diff);

        expect(result.sensitiveFileDetected).toBe(true);
        expect(result.sanitized).toContain("=[REDACTED]");
        expect(result.sanitized).not.toContain("my-super-secret-key");
    });

    test("should redact bearer tokens", () => {
        const diff = `
diff --git a/src/auth.ts b/src/auth.ts
+ Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456
`;

        const result = sanitizeDiff(diff);

        expect(result.sensitiveFileDetected).toBe(true);
    });

    test("should redact AWS access keys", () => {
        const diff = `
diff --git a/src/aws.ts b/src/aws.ts
+ const key = "AKIA1234567890ABCDEF";
`;

        const result = sanitizeDiff(diff);

        expect(result.sensitiveFileDetected).toBe(true);
    });

    test("should redact long base64 secrets", () => {
        const diff = `
diff --git a/src/token.ts b/src/token.ts
+ const token = "abcdefghijklmnopqrstuvwxyz1234567890ABCD";
`;

        const result = sanitizeDiff(diff);

        expect(result.sensitiveFileDetected).toBe(true);
        expect(result.sanitized).toContain("[REDACTED]");
    });

    test("should handle multiple files correctly", () => {
        const diff = `
diff --git a/src/app.ts b/src/app.ts
+ const safe = true;

diff --git a/.env b/.env
+ PASSWORD=secret
`;

        const result = sanitizeDiff(diff);

        expect(result.sensitiveFileDetected).toBe(true);
        expect(result.sanitized).toContain("const safe = true");
        expect(result.sanitized).toContain(
            "[REDACTED - sensitive file omitted]",
        );
    });
});

describe("isEmptyDiff", () => {
    test("returns true when all files are redacted", () => {
        const diff = `
diff --git a/.env b/.env
[REDACTED - sensitive file omitted]
`;

        expect(isEmptyDiff(diff)).toBe(true);
    });

    test("returns false when at least one file has content", () => {
        const diff = `
diff --git a/src/app.ts b/src/app.ts
+ const x = 1;
`;

        expect(isEmptyDiff(diff)).toBe(false);
    });

    test("ignores whitespace blocks", () => {
        const diff = `

diff --git a/.env b/.env
[REDACTED - sensitive file omitted]

`;

        expect(isEmptyDiff(diff)).toBe(true);
    });
});
