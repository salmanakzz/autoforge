import { groqChatCompletion } from "../Services/groq";
import { sanitizeAIOutput } from "../utils/sanitizeAIOutput";

type AIProviderOptions = {
    prompt: string;
    systemPrompt?: string;
};

export async function callAIProvider({
    prompt,
    systemPrompt,
}: AIProviderOptions): Promise<string> {
    try {
        const res = await groqChatCompletion({ prompt, systemPrompt });
        return sanitizeAIOutput(res);
    } catch (error) {
        throw new Error("Failed to call AI provider: " + error);
    }
}

export async function generateBranchNameFromDiff(
    diff: string
): Promise<string> {
    return callAIProvider({
        prompt: `
Analyze the following git diff and generate a **short, semantic branch name**.

Rules:
- Format: <type>/<short-description>
- Allowed types: feat, fix, refactor, docs, chore, test, style, perf
- Detect the correct type from the diff automatically
- Detect the most relevant folder/file as scope if obvious (e.g., auth, hotels, booking)
- Use lowercase only
- Use hyphens for spaces
- Maximum 40 characters total
- Output must contain ONLY the branch name (no explanation, no code block)
- Never include punctuation, quotes, emojis, or extra text

Diff:
${diff}
`,
    });
}

export async function generateCommitMessageFromDiff(
    diff: string
): Promise<string> {
    return callAIProvider({
        prompt: `
Analyze the following git diff and generate a **professional conventional commit message**.

Rules:
- Format: <type>(<scope>): <description>
- Allowed types: feat, fix, refactor, docs, chore, test, style, perf
- Detect the correct type automatically based on the changes
- Detect scope automatically from the modified module/folder/file (e.g., auth, hotels, booking)
- If the change is breaking (API removed, signature changed), append "!"
  Example: feat(auth)!: remove deprecated login api
- Keep description short, meaningful, and lowercase
- Do NOT include trailing periods
- Output ONLY the commit message (no explanations, no code blocks)

Diff:
${diff}
`,
    });
}
