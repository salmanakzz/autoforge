import * as path from "path";
import {
    generateSmartDescription,
    analyzeSignals,
    parseDiffContext,
} from "../utils/generateSmartDescription";
import { generateSmartBranchName } from "../utils/generateSmartBranchName ";
import { Signal } from "../utils/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomChatOptions {
    prompt: string;
    systemPrompt?: string;
}

// Conventional commit types ordered by priority when multiple signals match
type ConventionalType =
    | "feat"
    | "fix"
    | "refactor"
    | "perf"
    | "test"
    | "docs"
    | "style"
    | "chore"
    | "build";

// ─── Diff Extraction ──────────────────────────────────────────────────────────

/**
 * Extracts the raw diff block from the incoming prompt.
 * Supports both labeled ("Diff: ...") and bare diff formats.
 */
function extractDiff(prompt: string): string {
    const labeled = /Diff:\s*([\s\S]*)$/i.exec(prompt);
    if (labeled) {
        return labeled[1].trim();
    }

    // Check if the entire prompt IS the diff
    if (
        prompt.trimStart().startsWith("diff --git") ||
        prompt.trimStart().startsWith("---")
    ) {
        return prompt.trim();
    }

    const bare = /^(diff --git[\s\S]*|---\s+a\/[\s\S]*)$/m.exec(prompt);
    if (bare) {
        return bare[1].trim();
    }

    return "";
}

// ─── Output Mode Detection ────────────────────────────────────────────────────

type OutputMode = "branch" | "commit";

/**
 * Determines whether the caller wants a branch name or a commit message.
 * Defaults to "commit" when ambiguous.
 */
function detectOutputMode(prompt: string): OutputMode {
    if (/branch\s*name/i.test(prompt)) {
        return "branch";
    }
    if (/commit\s*message/i.test(prompt)) {
        return "commit";
    }
    return "commit";
}

// ─── Semantic Type Inference ──────────────────────────────────────────────────

/**
 * Maps signal verb + kind combinations to conventional commit types.
 *
 * Runs on the same signals already produced by generateSmartDescription,
 * so type and description are always consistent — no double-parsing.
 *
 * Priority order matters: a signal with verb "fix" beats "implement" for type
 * even if the fix signal has a lower score.
 */
const TYPE_RULES: Array<{
    test: (sig: Signal) => boolean;
    type: ConventionalType;
    priority: number;
}> = [
    // Explicit fix signals
    {
        test: (s) => s.verb === "refactor" && s.kind === "error-handling",
        type: "fix",
        priority: 10,
    },
    {
        test: (s) => s.kind === "error-handling" && s.verb === "add",
        type: "fix",
        priority: 9,
    },
    // Performance
    { test: (s) => s.verb === "optimize", type: "perf", priority: 8 },
    { test: (s) => s.kind === "performance", type: "perf", priority: 8 },
    // Tests
    { test: (s) => s.kind === "test", type: "test", priority: 7 },
    // Dependency / build changes
    { test: (s) => s.kind === "dependency", type: "build", priority: 7 },
    // Config / docs changes
    { test: (s) => s.kind === "config", type: "chore", priority: 6 },
    // Refactoring (rename, async conversion, structural changes)
    {
        test: (s) => s.verb === "refactor" || s.verb === "rename",
        type: "refactor",
        priority: 6,
    },
    // Style / logging cleanup
    {
        test: (s) => s.kind === "logging" && s.verb === "remove",
        type: "style",
        priority: 5,
    },
    // Pure removals
    { test: (s) => s.verb === "remove", type: "chore", priority: 4 },
    // Feature additions — lowest priority so specific types win
    {
        test: (s) => ["implement", "create", "add", "update"].includes(s.verb),
        type: "feat",
        priority: 3,
    },
];

/**
 * Infers the best conventional commit type from the ranked signal list.
 * Falls back to "chore" when nothing matches.
 */
function inferCommitType(signals: Signal[]): ConventionalType {
    let bestType: ConventionalType = "chore";
    let bestScore = -1;

    for (const signal of signals) {
        for (const rule of TYPE_RULES) {
            // Combine rule priority with signal confidence score
            const combined = rule.priority * (signal.score ?? 1);
            if (rule.test(signal) && combined > bestScore) {
                bestType = rule.type;
                bestScore = combined;
            }
        }
    }
    return bestType;
}

// ─── Semantic Scope Inference ─────────────────────────────────────────────────

/**
 * Derives a short, meaningful scope from file paths and signal context.
 *
 * Priority:
 *   1. Semantic domain inferred from file paths (auth, cart, api, db…)
 *   2. First meaningful directory segment (not "src", "lib", "app")
 *   3. Bare filename without extension
 *   4. "core" as last resort
 */
function inferScope(files: string[], signals: Signal[]): string {
    const DOMAIN_MAP: Array<{ pattern: RegExp; scope: string }> = [
        { pattern: /\b(auth|login|session|oauth|passport)\b/i, scope: "auth" },
        { pattern: /\b(cart|basket|checkout)\b/i, scope: "cart" },
        { pattern: /\b(order)\b/i, scope: "orders" },
        { pattern: /\b(user|account|profile|member)\b/i, scope: "user" },
        { pattern: /\b(product|catalog|inventory)\b/i, scope: "product" },
        { pattern: /\b(payment|billing|invoice|stripe)\b/i, scope: "payment" },
        { pattern: /\b(controller|endpoint|handler)\b/i, scope: "api" },
        { pattern: /\b(migration|schema|entity)\b/i, scope: "db" },
        { pattern: /\b(config|setting|env|environment)\b/i, scope: "config" },
        { pattern: /\b(test|spec)\b/i, scope: "test" },
        { pattern: /\b(component|page|view|screen|layout)\b/i, scope: "ui" },
        { pattern: /\b(store|redux|zustand|context)\b/i, scope: "store" },
        { pattern: /\b(util|helper|lib|common|shared)\b/i, scope: "utils" },
        { pattern: /\b(middleware)\b/i, scope: "middleware" },
        { pattern: /\b(notification|email|sms|push)\b/i, scope: "notify" },
        { pattern: /\b(search|filter|sort)\b/i, scope: "search" },
        { pattern: /\b(upload|storage|s3)\b/i, scope: "storage" },
        { pattern: /\b(validator|validation)\b/i, scope: "validation" },
    ];

    // Score each scope by how many files match it
    const scopeHits: Record<string, number> = {};
    for (const file of files) {
        const filePath = file.toLowerCase();
        for (const { pattern, scope } of DOMAIN_MAP) {
            if (pattern.test(filePath)) {
                scopeHits[scope] = (scopeHits[scope] ?? 0) + 1;
                break; // one scope per file
            }
        }
    }

    // Pick the most frequent scope
    const topScope = Object.entries(scopeHits).sort((a, b) => b[1] - a[1])[0];

    if (topScope) {
        return topScope[0];
    }

    // Fallback: first meaningful directory across all files
    const NOISE_DIRS = new Set([
        "src",
        "lib",
        "app",
        ".",
        "dist",
        "build",
        "packages",
        "modules",
    ]);

    const dirFrequency: Record<string, number> = {};
    for (const file of files) {
        const parts = file.split("/").slice(0, -1); // dirs only, no filename
        for (const part of parts) {
            if (!NOISE_DIRS.has(part.toLowerCase())) {
                dirFrequency[part] = (dirFrequency[part] ?? 0) + 1;
            }
        }
    }

    const topDir = Object.entries(dirFrequency).sort((a, b) => b[1] - a[1])[0];

    if (topDir) {
        return topDir[0].toLowerCase();
    }

    // Filename fallback
    const primaryFile = files[0] ?? "";
    const baseName =
        primaryFile
            .split("/")
            .pop()
            ?.replace(/\.[^.]+$/, "") ?? "";
    return baseName && baseName !== "index" ? baseName : "core";
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Generates a Copilot-quality commit message or branch name from a git diff.
 *
 * Output examples:
 *   Commit: "feat(cart): implement addToCart and calculateTotal, and create ProductPage component"
 *   Branch: "feat/cart-implement-add-to-cart-and-calculate-total"
 *
 * The type, scope, and description are all derived from the same signal
 * pipeline — ensuring they are always semantically consistent.
 *
 * @param prompt - Raw prompt string containing the diff and mode hint
 * @returns Formatted commit message or branch name string
 */
export async function customChatCompletion({
    prompt,
}: CustomChatOptions): Promise<string> {
    // ── 0. Extract diff ────────────────────────────────────────────────────────
    const diff = extractDiff(prompt);

    if (!diff || diff.length < 5) {
        return "chore: empty diff";
    }

    // ── 1. Parse diff into shared context ─────────────────────────────────────
    //    One parse pass — reused by all downstream steps
    const ctx = parseDiffContext(diff);

    // ── 2. Run signal pipeline ─────────────────────────────────────────────────
    //    analyzeSignals returns the ranked, deduplicated signals array
    //    (same data generateSmartDescription uses internally)
    const signals = analyzeSignals(ctx);

    // ── 3. Derive all three components from signals ────────────────────────────
    const type = inferCommitType(signals);
    const scope = inferScope(ctx.fileNames, signals);
    const description = generateSmartDescription(ctx, signals); // uses same ctx internally

    // ── 4. Detect output mode ──────────────────────────────────────────────────
    const mode = detectOutputMode(prompt);

    // ── 5. Format output ───────────────────────────────────────────────────────
    if (mode === "branch") {
        // Dedicated branch name engine — works from signals directly,
        // never from the human-readable description string
        return generateSmartBranchName(signals, scope, type);
    }

    // Commit format: "feat(cart): implement addToCart and calculateTotal"
    return `${type}(${scope}): ${description}`;
}
