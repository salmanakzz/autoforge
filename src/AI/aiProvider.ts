import { chatCompletion } from "../Services/openai";

type AIProviderOptions = {
    prompt: string;
    systemPrompt?: string;
};

export async function callAIProvider({
    prompt,
    systemPrompt,
}: AIProviderOptions): Promise<string> {
    try {
        const res = await chatCompletion(prompt, systemPrompt);
        return res;
    } catch (error) {
        throw new Error("Failed to call AI provider: " + error);
    }
}

export async function generateBranchNameFromDiff(
    diff: string
): Promise<string> {
    return callAIProvider({
        prompt: `Suggest a git branch name based on this diff:\n${diff}`,
        systemPrompt:
            "You are a helpful assistant that creates short, semantic branch names.",
    });
}

export async function generateCommitMessageFromDiff(
    diff: string
): Promise<string> {
    return callAIProvider({
        prompt: `Write a git commit message based on this diff:\n${diff}`,
        systemPrompt:
            "You are a helpful assistant that creates clear, conventional commit messages.",
    });
}
