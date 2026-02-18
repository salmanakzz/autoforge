/**
 * Git Diff Summarization Engine
 *
 * Produces Copilot-style commit messages by synthesizing all detected signals
 * into a single fluent narrative rather than concatenating independent labels.
 *
 * Output style:
 *   "implement addToCart and calculateTotal functions, and create ProductPage component"
 *   "refactor BookingService error handling and convert promise chains to async/await"
 *   "add authentication middleware and input validation to user routes"
 */

import { ChangeVerb, DiffContext, Signal, SignalDetector, SignalKind } from "./types";


/**
 * A signal is a atomic piece of evidence extracted from the diff.
 * Multiple signals are synthesized into a final sentence.
 */

// ─── Diff Parsing ─────────────────────────────────────────────────────────────

export function parseDiffContext(diff: string): DiffContext {
    const lines = diff.split("\n");

    const addedLines = lines
        .filter((l) => /^\+(?!\+\+)/.test(l))
        .map((l) => l.slice(1));

    const removedLines = lines
        .filter((l) => /^-(?!--)/.test(l))
        .map((l) => l.slice(1));

    const fileNames = [...diff.matchAll(/^diff --git a\/(.+?) b\//gm)].map(
        (m) => m[1],
    );

    const addedContent = addedLines.join("\n");
    const removedContent = removedLines.join("\n");

    return {
        raw: diff,
        lower: diff.toLowerCase(),
        addedLines,
        removedLines,
        addedContent,
        removedContent,
        fileNames,
        lineDelta: addedLines.length - removedLines.length,
    };
}

// ─── Utility Helpers ──────────────────────────────────────────────────────────

/** All matches of a capture group from a global regex */
function allMatches(pattern: RegExp, text: string): string[] {
    return [...text.matchAll(pattern)].map((m) => m[1]).filter(Boolean);
}

/** First capture group match or null */
function firstMatch(pattern: RegExp, text: string): string | null {
    return pattern.exec(text)?.[1] ?? null;
}

/** Pattern hits added content but not removed (net new) */
function netAdded(pattern: RegExp, ctx: DiffContext): boolean {
    return pattern.test(ctx.addedContent) && !pattern.test(ctx.removedContent);
}

/** Pattern hits removed content but not added (net deleted) */
function netRemoved(pattern: RegExp, ctx: DiffContext): boolean {
    return pattern.test(ctx.removedContent) && !pattern.test(ctx.addedContent);
}

/** Pattern hits both sides (modification/refactor) */
function inBoth(pattern: RegExp, ctx: DiffContext): boolean {
    return pattern.test(ctx.addedContent) && pattern.test(ctx.removedContent);
}

/**
 * Converts camelCase / PascalCase to readable words.
 * addToCart → "addToCart"  (kept as-is — identifiers read fine in commit msgs)
 */
function readable(name: string): string {
    // Keep the original casing — it's more readable in commit context
    return name;
}

// ─── Signal Detectors ─────────────────────────────────────────────────────────

/**
 * Extracts named functions added/removed/refactored in the diff.
 * Covers: function declarations, arrow functions, class methods, async variants.
 */
const detectFunctions: SignalDetector = (ctx) => {
    // Match function declarations on added lines (strip the leading + in raw)
    const addedFns = allMatches(
        /^\+\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm,
        ctx.raw,
    );

    // Arrow / const functions
    const addedArrows = allMatches(
        /^\+\s*(?:export\s+)?(?:const|let)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?\(/gm,
        ctx.raw,
    );

    const removedFns = allMatches(
        /^-\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm,
        ctx.raw,
    );

    const addedNames = [...new Set([...addedFns, ...addedArrows])];
    const removedNames = new Set(removedFns);

    const signals: Signal[] = [];

    // Pure additions (not present in removed)
    const newFns = addedNames.filter((n) => !removedNames.has(n));
    if (newFns.length > 0) {
        signals.push({
            kind: "function",
            subjects: newFns,
            verb: "implement",
            score: 8,
        });
    }

    // Renames: removed name replaced by added name
    if (addedNames.length > 0 && removedFns.length > 0 && newFns.length === 0) {
        signals.push({
            kind: "function",
            subjects: [`${removedFns[0]} → ${addedNames[0]}`],
            verb: "rename",
            score: 9,
        });
    }

    return signals;
};

/**
 * Extracts named React components and custom hooks.
 * Prioritized over generic function detection to produce more semantic labels.
 */
const detectComponentsAndHooks: SignalDetector = (ctx) => {
    const signals: Signal[] = [];

    // Broadened JSX check — covers lowercase tags (<div>), self-closing (<br />),
    // closing tags (</div>), and PascalCase components (<MyComp>)
    const hasJsx =
        /<[A-Za-z][\w.]*[\s/>]/.test(ctx.addedContent) ||
        /<\/[A-Za-z]/.test(ctx.addedContent);

    const addedComponents = hasJsx
        ? allMatches(
              /^\+\s*(?:export\s+)?(?:default\s+)?(?:function|const)\s+([A-Z][A-Za-z0-9_$]*)/gm,
              ctx.raw,
          )
        : [];

    if (addedComponents.length > 0) {
        signals.push({
            kind: "component",
            subjects: addedComponents,
            verb: "create",
            score: 9,
        });
    }

    // Hooks: camelCase starting with "use"
    const addedHooks = allMatches(
        /^\+\s*(?:export\s+)?(?:function|const)\s+(use[A-Z][A-Za-z0-9_$]*)/gm,
        ctx.raw,
    );

    if (addedHooks.length > 0) {
        signals.push({
            kind: "hook",
            subjects: addedHooks,
            verb: "implement",
            score: 8,
        });
    }

    return signals;
};

/**
 * Detects named class additions or refactors.
 */
const detectClasses: SignalDetector = (ctx) => {
    const addedClasses = allMatches(
        /^\+\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm,
        ctx.raw,
    );
    const removedClasses = new Set(
        allMatches(
            /^-\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)/gm,
            ctx.raw,
        ),
    );

    const newClasses = addedClasses.filter((c) => !removedClasses.has(c));

    if (newClasses.length > 0) {
        return [
            {
                kind: "class",
                subjects: newClasses,
                verb: "implement",
                score: 7,
            },
        ];
    }
    if (addedClasses.length > 0 && removedClasses.size > 0) {
        return [
            {
                kind: "class",
                subjects: addedClasses,
                verb: "refactor",
                score: 7,
            },
        ];
    }
    return [];
};

/**
 * Detects authentication / authorization changes.
 */
const detectAuth: SignalDetector = (ctx) => {
    const pattern =
        /\b(authenticate|authorize|jwt|oauth|bearer|passport|session|permission|role(?:Guard)?|isAuthenticated)\b/i;
    if (!pattern.test(ctx.addedContent)) {
        return [];
    }

    const verb = netAdded(pattern, ctx) ? "add" : "update";
    return [{ kind: "auth", subjects: ["authentication"], verb, score: 9 }];
};

/**
 * Detects middleware additions (auth, logging, cors, rate limiting, etc.)
 */
const detectMiddleware: SignalDetector = (ctx) => {
    const pattern =
        /\b(middleware|app\.use\(|router\.use\(|cors\(|helmet\(|rateLimit\(|morgan\()\b/i;
    if (!netAdded(pattern, ctx)) {
        return [];
    }

    const name =
        firstMatch(
            /\b(cors|helmet|rateLimit|morgan|compression)\b/i,
            ctx.addedContent,
        ) ?? "middleware";
    return [{ kind: "middleware", subjects: [name], verb: "add", score: 8 }];
};

/**
 * Detects API route changes and extracts route paths where possible.
 */
const detectRoutes: SignalDetector = (ctx) => {
    const routeDecl =
        /\b(router|app)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    const decorators =
        /^\+\s*@(Get|Post|Put|Patch|Delete)\s*\(\s*['"`]([^'"`]*)['"`]\)/gm;

    const paths = [
        ...allMatches(routeDecl, ctx.raw), // group 3 is path, but allMatches takes group 1 — adjust below
        ...allMatches(decorators, ctx.raw),
    ];

    // Re-extract with full match for route method + path
    const routeMatches = [
        ...ctx.raw.matchAll(
            /^\+.*\b(?:router|app)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gim,
        ),
    ].map((m) => m[2]);

    if (
        routeMatches.length === 0 &&
        !netAdded(/\b(router|app)\.(get|post|put|patch|delete)\b/i, ctx)
    ) {
        return [];
    }

    const verb = netAdded(/\b(router|app)\.(get|post|put|patch|delete)\b/i, ctx)
        ? "add"
        : "update";
    const subjects =
        routeMatches.length > 0 ? routeMatches.slice(0, 2) : ["api routes"];

    return [{ kind: "route", subjects, verb, score: 7 }];
};

/**
 * Detects error handling additions, removals, or restructuring.
 */
const detectErrorHandling: SignalDetector = (ctx) => {
    const tryCatch = /try\s*\{[\s\S]*?\}\s*catch/;
    const customError = /\bthrow\s+new\s+\w+Error/;

    if (netAdded(tryCatch, ctx) || netAdded(customError, ctx)) {
        return [
            {
                kind: "error-handling",
                subjects: ["error handling"],
                verb: "add",
                score: 8,
            },
        ];
    }
    if (inBoth(tryCatch, ctx)) {
        return [
            {
                kind: "error-handling",
                subjects: ["error handling"],
                verb: "refactor",
                score: 7,
            },
        ];
    }
    if (netRemoved(tryCatch, ctx)) {
        return [
            {
                kind: "error-handling",
                subjects: ["error handling"],
                verb: "remove",
                score: 5,
            },
        ];
    }
    return [];
};

/**
 * Detects async/await adoption or restructuring.
 */
const detectAsync: SignalDetector = (ctx) => {
    const promiseToAsync =
        netAdded(/\bawait\b/, ctx) && netRemoved(/\.then\s*\(/, ctx);
    if (promiseToAsync) {
        return [
            {
                kind: "async",
                subjects: ["promise chains to async/await"],
                verb: "refactor",
                score: 8,
            },
        ];
    }
    return [];
};

/**
 * Detects input validation additions.
 */
const detectValidation: SignalDetector = (ctx) => {
    const pattern =
        /\b(z\.object|Joi\.|yup\.|class-validator|@IsString|@IsEmail|@IsNotEmpty|zod|validate\()\b/i;
    if (!netAdded(pattern, ctx)) {
        return [];
    }
    return [
        {
            kind: "validation",
            subjects: ["input validation"],
            verb: "add",
            score: 8,
        },
    ];
};

/**
 * Detects database schema, model, or query changes.
 */
const detectDatabase: SignalDetector = (ctx) => {
    const schemaPattern =
        /\b(schema|migration|@Entity|@Column|@Table|CREATE TABLE|ALTER TABLE|prisma|mongoose\.model)\b/i;
    const queryPattern =
        /\b(findOne|findAll|findBy|\.where\(|queryBuilder|createQueryBuilder)\b/i;

    if (netAdded(schemaPattern, ctx)) {
        return [
            {
                kind: "database",
                subjects: ["database schema"],
                verb: "add",
                score: 8,
            },
        ];
    }
    if (inBoth(schemaPattern, ctx)) {
        return [
            {
                kind: "database",
                subjects: ["database schema"],
                verb: "update",
                score: 7,
            },
        ];
    }
    if (netAdded(queryPattern, ctx)) {
        const isOptimized = /\b(index|cache|eager)\b/i.test(ctx.addedContent);
        const subject = isOptimized ? "database queries" : "database queries";
        const verb = isOptimized ? "optimize" : "add";
        return [{ kind: "database", subjects: [subject], verb, score: 7 }];
    }
    return [];
};

/**
 * Detects test additions or updates.
 */
const detectTests: SignalDetector = (ctx) => {
    const isTestFile = ctx.fileNames.some((f) =>
        /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(f),
    );
    const testPattern =
        /\b(describe\(|it\(|test\(|expect\(|beforeEach\(|afterEach\()\b/;

    if (!isTestFile && !testPattern.test(ctx.addedContent)) {
        return [];
    }

    const verb = netAdded(testPattern, ctx) ? "add" : "update";
    return [{ kind: "test", subjects: ["unit tests"], verb, score: 7 }];
};

/**
 * Detects dependency or package changes.
 */
const detectDependencies: SignalDetector = (ctx) => {
    const isPackageFile = ctx.fileNames.some((f) =>
        /package\.json|yarn\.lock|package-lock\.json/.test(f),
    );
    if (!isPackageFile) {
        return [];
    }

    const versionPattern = /"[^"]+"\s*:\s*"[\^~]?\d/;

    // Check inBoth() FIRST — a version bump has the same package key on both
    // sides, so netAdded and netRemoved both return false and miss it entirely
    if (inBoth(versionPattern, ctx)) {
        return [
            {
                kind: "dependency",
                subjects: ["dependencies"],
                verb: "update",
                score: 9,
            },
        ];
    }
    if (netAdded(versionPattern, ctx)) {
        return [
            {
                kind: "dependency",
                subjects: ["dependencies"],
                verb: "add",
                score: 9,
            },
        ];
    }
    if (netRemoved(versionPattern, ctx)) {
        return [
            {
                kind: "dependency",
                subjects: ["dependencies"],
                verb: "remove",
                score: 9,
            },
        ];
    }

    return [];
};

/**
 * Detects configuration file changes.
 */
const detectConfig: SignalDetector = (ctx) => {
    const isConfigFile = ctx.fileNames.some((f) =>
        /\.(env|config|conf|yaml|yml|toml)$|config\//i.test(f),
    );
    const configPattern =
        /\b(process\.env\.|ConfigModule|dotenv|@ConfigService)\b/;

    if (!isConfigFile && !configPattern.test(ctx.addedContent)) {
        return [];
    }
    return [
        {
            kind: "config",
            subjects: ["configuration"],
            verb: "update",
            score: 7,
        },
    ];
};

/**
 * Detects debug logging removals (cleanup intent).
 */
const detectLogging: SignalDetector = (ctx) => {
    const logPattern = /\bconsole\.(log|debug|warn|error)\b/;
    if (netRemoved(logPattern, ctx)) {
        return [
            {
                kind: "logging",
                subjects: ["debug logging"],
                verb: "remove",
                score: 5,
            },
        ];
    }
    return [];
};

/**
 * Detects performance improvements (memoization, caching, debounce, etc.)
 */
const detectPerformance: SignalDetector = (ctx) => {
    const pattern =
        /\b(useMemo|useCallback|React\.memo|memoize|debounce|throttle|cache|lazy\(|Suspense)\b/;
    if (!netAdded(pattern, ctx)) {
        return [];
    }
    return [
        {
            kind: "performance",
            subjects: ["performance"],
            verb: "optimize",
            score: 8,
        },
    ];
};

// ─── Detector Pipeline ────────────────────────────────────────────────────────

/** Ordered from most specific → least specific. */
const DETECTORS: SignalDetector[] = [
    detectComponentsAndHooks, // must run before detectFunctions to claim PascalCase names
    detectFunctions,
    detectClasses,
    detectAuth,
    detectMiddleware,
    detectRoutes,
    detectErrorHandling,
    detectAsync,
    detectValidation,
    detectDatabase,
    detectTests,
    detectDependencies,
    detectConfig,
    detectLogging,
    detectPerformance,
];

// ─── Synthesis Engine ─────────────────────────────────────────────────────────

/**
 * Groups signals by verb so we can produce fluent sentences like:
 *   "implement X and Y, and create Z"
 * instead of flat concatenation.
 */
function synthesize(signals: Signal[]): string {
    if (signals.length === 0) {
        return "";
    }

    // Deduplicate subjects within the same kind (components can't also be functions)
    const claimedSubjects = new Set<string>();
    const deduped: Signal[] = [];

    for (const sig of signals) {
        const freshSubjects = sig.subjects.filter(
            (s) => !claimedSubjects.has(s),
        );
        if (freshSubjects.length === 0) {
            continue;
        }
        freshSubjects.forEach((s) => claimedSubjects.add(s));
        deduped.push({ ...sig, subjects: freshSubjects });
    }

    // Merge signals with the same verb into groups
    const verbGroups = new Map<ChangeVerb, string[]>();
    for (const sig of deduped) {
        if (!verbGroups.has(sig.verb)) {
            verbGroups.set(sig.verb, []);
        }
        verbGroups.get(sig.verb)!.push(...sig.subjects.map(readable));
    }

    // Render each verb group as a clause: "implement addToCart and calculateTotal"
    const clauses: string[] = [];
    for (const [verb, subjects] of verbGroups) {
        const subjectPhrase = joinWithAnd(subjects);
        clauses.push(`${verb} ${subjectPhrase}`);
    }

    // Join clauses: "implement X and Y, and create Z"
    return joinClauses(clauses);
}

/** Joins items with commas and "and": ["a","b","c"] → "a, b, and c" */
function joinWithAnd(items: string[]): string {
    if (items.length === 1) {
        return items[0];
    }
    if (items.length === 2) {
        return `${items[0]} and ${items[1]}`;
    }
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** Joins multiple clauses with ", and" connector */
function joinClauses(clauses: string[]): string {
    if (clauses.length === 1) {
        return clauses[0];
    }
    if (clauses.length === 2) {
        return `${clauses[0]}, and ${clauses[1]}`;
    }
    return `${clauses.slice(0, -1).join("; ")}, and ${clauses[clauses.length - 1]}`;
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function fallbackDescription(ctx: DiffContext): string {
    const { addedLines, removedLines, lineDelta } = ctx;
    if (addedLines.length > 0 && removedLines.length > 0) {
        return lineDelta > 20 ? "refactor existing logic" : "update logic";
    }
    if (addedLines.length > 0) {
        return "add new functionality";
    }
    if (removedLines.length > 0) {
        return "remove unused code";
    }
    return "modify files";
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyzes a raw git diff and returns a concise, Copilot-style description
 * of what changed, synthesized from all detected signals.
 *
 * @param diff - Raw output from `git diff` or `git diff --cached`
 * @returns Lowercase, fluent commit-message-style description
 *
 * @example
 * generateSmartDescription(diff)
 * // → "implement addToCart and calculateTotal functions, and create ProductPage component"
 * // → "refactor BookingService error handling and convert promise chains to async/await"
 * // → "add authentication middleware and input validation to user routes"
 */
/**
 * Runs all detectors and returns the top-ranked, deduplicated signals.
 * Exported so callers can derive commit type/scope from the same pipeline
 * without re-parsing the diff.
 */
export function analyzeSignals(ctx: DiffContext): Signal[] {
    const rawSignals: Signal[] = DETECTORS.flatMap((detect) => detect(ctx));

    // Keep highest-scoring signal per kind
    const bestByKind = new Map<SignalKind, Signal>();
    for (const signal of rawSignals) {
        const existing = bestByKind.get(signal.kind);
        if (!existing || signal.score > existing.score) {
            bestByKind.set(signal.kind, signal);
        }
    }

    // Return sorted by score descending, capped at 4
    return [...bestByKind.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);
}

export function generateSmartDescription(diff: string): string {
    if (!diff?.trim()) {
        return "no changes detected";
    }

    const ctx = parseDiffContext(diff);
    const topSignals = analyzeSignals(ctx);

    const description = synthesize(topSignals);
    return description || fallbackDescription(ctx);
}
