/**
 * Branch Name Generation Engine
 *
 * Produces clean, git-safe branch name slugs from diff signals.
 * Completely separate from commit message generation — branch names
 * have different constraints (no camelCase, no conjunctions, max ~50 chars).
 *
 * Output style:
 *   "feat/cart-add-to-cart-calculate-total"
 *   "fix/auth-error-handling"
 *   "refactor/booking-async-await"
 *   "perf/db-query-optimization"
 */

import { ChangeVerb, Signal } from "./types";

// ─── CamelCase / PascalCase Splitter ──────────────────────────────────────────

/**
 * Splits camelCase and PascalCase identifiers into lowercase hyphenated words.
 * This is the key transformation for branch names — identifiers that read fine
 * in commit messages ("addToCart") need to be split for branch slugs.
 *
 * addToCart      → "add-to-cart"
 * ProductPage    → "product-page"
 * useAuthHook    → "use-auth-hook"
 * HTMLParser     → "html-parser"
 */
function splitIdentifier(name: string): string {
    return (
        name
            // Insert hyphen before sequences of uppercase followed by lowercase (XMLParser → XML-Parser)
            .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
            // Insert hyphen before single uppercase preceded by lowercase (addTo → add-To)
            .replace(/([a-z\d])([A-Z])/g, "$1-$2")
            .toLowerCase()
    );
}

// ─── Subject → Slug Words ──────────────────────────────────────────────────────

/**
 * Filters words that add no value in a branch name.
 * Unlike commit messages, branch names should skip articles, conjunctions,
 * and generic nouns that bloat the slug.
 */
const STOP_WORDS = new Set([
    // conjunctions / articles / prepositions (existing)
    "and",
    "or",
    "the",
    "a",
    "an",
    "to",
    "of",
    "for",
    "in",
    "on",
    "with",
    "from",
    "by",
    "is",
    "are",
    "was",
    "be",
    "as",
    "at",
    // generic code nouns (existing)
    "function",
    "functions",
    "component",
    "components",
    "class",
    "classes",
    "hook",
    "hooks",
    "handler",
    "handlers",
    "module",
    "modules",
    "service",
    "services",
    "helper",
    "helpers",
    "util",
    "utils",
    "new",
    "existing",
    "current",
    "old",
    // ✅ NEW — async/promise noise words
    "promise",
    "chains",
    "chain",
    // ✅ NEW — other common signal noise
    "handling",
    "logic",
    "based",
]);

/**
 * Converts a signal subject string into clean branch slug words.
 *
 * "addToCart"          → ["add", "to", "cart"]
 * "ProductPage"        → ["product", "page"]
 * "error handling"     → ["error", "handling"]
 * "promise chains to async/await" → ["async", "await"]   (strips noise)
 */
function subjectToSlugWords(subject: string): string[] {
    return subject
        .split(/[\s\/\-_→]+/) // split on spaces, slashes, hyphens, arrows
        .flatMap((word) => splitIdentifier(word).split("-")) // split camelCase
        .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, "")) // clean chars
        .filter((w) => w.length > 1 && !STOP_WORDS.has(w)); // remove stop words + single chars
}

// ─── Verb → Branch Prefix Word ────────────────────────────────────────────────

/**
 * Maps signal verbs to concise branch action words.
 * Branch names use shorter, imperative words vs commit message verbs.
 */
const VERB_TO_BRANCH_WORD: Record<ChangeVerb, string> = {
    implement: "add", // "implement" is too long for a branch slug
    create: "add",
    add: "add",
    remove: "remove",
    refactor: "refactor",
    update: "update",
    rename: "rename",
    optimize: "optimize",
};

// ─── Signal → Slug Segment ────────────────────────────────────────────────────

/**
 * Converts a single signal into an ordered list of slug words.
 * Caps subjects to 2 to keep branch names from growing too long.
 *
 * Signal: { verb: "implement", subjects: ["addToCart", "calculateTotal"] }
 * → ["add", "to", "cart", "calculate", "total"]
 */
function signalToSlugWords(signal: Signal, scope?: string): string[] {
    const verbWord = VERB_TO_BRANCH_WORD[signal.verb];

    const subjectWords = signal.subjects.slice(0, 2).flatMap((words) => {
        const slugWords = subjectToSlugWords(words);
        // Strip leading word if it duplicates the scope — it's redundant
        // e.g. scope="product", subject=["product","page"] → ["page"]
        // but scope="cart", subject=["product","page"] → ["product","page"]
        if (scope && slugWords[0] === scope) {
            return slugWords.slice(1);
        }
        return slugWords;
    });

    return [verbWord, ...subjectWords];
}
// ─── Deduplication ────────────────────────────────────────────────────────────

/**
 * Removes duplicate adjacent words that arise from merging multiple signals.
 * e.g. ["add", "auth", "add", "validation"] → ["add", "auth", "validation"]
 */
function deduplicateWords(words: string[]): string[] {
    const seen = new Set<string>();
    return words.filter((w) => {
        if (seen.has(w)) {
            return false;
        }
        seen.add(w);
        return true;
    });
}

// ─── Final Slug Assembly ──────────────────────────────────────────────────────

const MAX_SLUG_LENGTH = 45; // leaves room for "feat/" prefix within ~50 char total

/**
 * Assembles and trims the final hyphenated slug.
 * Cuts at a word boundary to avoid truncating mid-word.
 */
function assembleSlug(words: string[]): string {
    const full = words.join("-");

    if (full.length <= MAX_SLUG_LENGTH) {
        return full;
    }

    // Trim to max length at a word boundary
    const trimmed = full.slice(0, MAX_SLUG_LENGTH);
    const lastHyphen = trimmed.lastIndexOf("-");
    return lastHyphen > 10 ? trimmed.slice(0, lastHyphen) : trimmed;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a clean, git-safe branch name slug from diff signals.
 *
 * Works directly from the signal pipeline — never from the human-readable
 * commit description string, which contains camelCase identifiers,
 * conjunctions, and punctuation unsuitable for branch names.
 *
 * @param signals - Ranked signals from analyzeSignals()
 * @param scope   - Semantic scope from inferScope() (e.g. "cart", "auth")
 * @param type    - Conventional commit type (e.g. "feat", "fix")
 * @returns Full branch name e.g. "feat/cart-add-to-cart-calculate-total"
 *
 * @example
 * generateSmartBranchName(signals, "cart", "feat")
 * // → "feat/cart-add-to-cart-calculate-total"
 *
 * generateSmartBranchName(signals, "auth", "fix")
 * // → "fix/auth-error-handling"
 *
 * generateSmartBranchName(signals, "booking", "refactor")
 * // → "refactor/booking-async-await"
 */
export function generateSmartBranchName(
    signals: Signal[],
    scope: string,
    type: string,
): string {
    if (signals.length === 0) {
        return `${type}/${scope}-update`;
    }

    const topSignals = signals.slice(0, 2);

    // Pass scope so signalToSlugWords can trim redundant leading words
    const allWords = topSignals.flatMap((s) => signalToSlugWords(s, scope));

    const deduped = deduplicateWords(allWords);
    const slug = assembleSlug([scope, ...deduped]);

    return `${type}/${slug}`;
}
