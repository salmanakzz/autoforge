type AIProviderOptions = {
    prompt: string;
    systemPrompt?: string;
    model?: string;
};

export async function callAIProvider({
    prompt,
    systemPrompt,
    model = "gpt-4",
}: AIProviderOptions): Promise<string> {
    // Swap this with Ollama/local/OpenAI provider
    // const res = await fetch("https://api.openai.com/v1/chat/completions", {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    //     },
    //     body: JSON.stringify({
    //         model,
    //         messages: [
    //             ...(systemPrompt
    //                 ? [{ role: "system", content: systemPrompt }]
    //                 : []),
    //             { role: "user", content: prompt },
    //         ],
    //     }),
    // });

    // const json = await res.json();
    // return json.choices?.[0]?.message?.content?.trim() || "";
    return "nice-test";
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
