import * as vscode from "vscode";
import { customChatCompletion } from "../Services/custom";
import { groqChatCompletion } from "../Services/groq";
import { sanitizeAIOutput } from "../utils/sanitizeAIOutput";
import { isEmptyDiff, sanitizeDiff } from "../utils/sanitizeDiff";

type AIProviderOptions = {
    prompt: string;
    systemPrompt?: string;
};

export async function callAIProvider({
    prompt,
    systemPrompt,
}: AIProviderOptions): Promise<string> {
    try {
        const selectedProvider = vscode.workspace
            .getConfiguration("myExtension")
            .get("provider");

        if (!selectedProvider) {
            throw new Error("AI provider is not set in the configuration.");
        }

        const { sanitized, sensitiveFileDetected } = sanitizeDiff(prompt);

        if (
            sensitiveFileDetected &&
            (!sanitized.trim() || isEmptyDiff(sanitized))
        ) {
            return "chore/update-configuration";
        }

        if (selectedProvider === "groq") {
            const res = await groqChatCompletion({
                prompt: sanitized,
                systemPrompt,
            });
            return sanitizeAIOutput(res);
        } else if (selectedProvider === "custom") {
            const res = await customChatCompletion({
                prompt: sanitized,
                systemPrompt,
            });
            return sanitizeAIOutput(res);
        } else {
            throw new Error("Unsupported AI provider selected.");
        }
    } catch (error) {
        console.error("Failed to call AI provider: " + error);
        throw error;
    }
}

export async function generateBranchNameFromDiff(
    diff: string,
): Promise<string> {
    return callAIProvider({
        prompt: `
You are an expert senior software engineer analyzing git diffs.

Your task is to generate a SHORT, semantic git branch name based ONLY on the provided diff.

Think internally before answering:
1. Identify the PRIMARY intent of the change (feature, bug fix, refactor, etc.)
2. Ignore formatting-only noise unless it is the main change
3. Detect the most relevant logical scope from file paths, folders, or domain concepts
4. Prefer business/domain scope over technical files when obvious
5. Summarize the change in the smallest meaningful phrase

STRICT OUTPUT RULES:
- Format: <type>/<short-description>
- Allowed types: feat, fix, refactor, docs, chore, test, style, perf
- Lowercase only
- Use hyphens instead of spaces
- Maximum 40 characters total
- No emojis
- No punctuation except hyphen and slash
- No explanations
- No quotes
- Output ONLY the branch name

PRIORITY RULES:
- New functionality → feat
- Bug correction → fix
- Code restructuring without behavior change → refactor
- Dependency/config/build changes → chore
- Tests added/updated → test
- Formatting/linting only → style
- Performance improvement → perf
- Documentation only → docs

If scope is unclear, omit it and keep description concise.

Git Diff:
${diff}
`,
    });
}

export async function generateCommitMessageFromDiff(
    diff: string,
): Promise<string> {
    return callAIProvider({
        prompt: `
You are a senior engineer generating professional Conventional Commit messages from git diffs.

Analyze the diff carefully and determine the TRUE intent of the change.

INTERNAL ANALYSIS (do not output):
1. Determine primary change type
2. Detect logical scope from folders/modules/domain names
3. Ignore unrelated noise or formatting unless dominant
4. Detect breaking API or signature changes
5. Produce a concise human-written summary

OUTPUT RULES (STRICT):
- Format: <type>(<scope>): <description>
- Allowed types: feat, fix, refactor, docs, chore, test, style, perf
- Lowercase only
- Description must be concise and meaningful
- Do NOT include trailing periods
- No emojis
- No explanations
- No markdown or code blocks
- Output ONLY the commit message

BREAKING CHANGE RULE:
If public API, schema, function signature, or behavior compatibility changes,
append "!" after type or scope:
Example: feat(auth)!: remove deprecated login api

TYPE PRIORITY:
- New capability → feat
- Bug resolution → fix
- Internal restructuring → refactor
- Dependency/config/build → chore
- Tests → test
- Formatting only → style
- Performance improvement → perf
- Docs only → docs

SCOPE DETECTION:
Prefer domain/module names from paths such as:
auth, booking, hotels, payments, api, ui, extension, pricing, checkout.

If scope cannot be confidently inferred, omit parentheses.

Git Diff:
${diff}
`,
    });
}
