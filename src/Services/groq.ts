import * as vscode from "vscode";

interface GroqCompletionOptions {
    model?: string;
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
}

const groqChatCompletion = async ({
    prompt,
    systemPrompt,
    model = "meta-llama/llama-4-scout-17b-16e-instruct",
    maxTokens = 1024,
}: GroqCompletionOptions): Promise<string> => {
    try {
        const groqApiKey = vscode.workspace
            .getConfiguration("myExtension")
            .get("apiKey");

        if (!groqApiKey) {
            throw new Error("Groq API key is not set in the configuration.");
        }

        const res = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${groqApiKey}`,
                },
                body: JSON.stringify({
                    model: model,
                    temperature: 0,
                    messages: [
                        {
                            role: "system",
                            content:
                                "You generate git metadata similar to GitHub Copilot and must be precise and deterministic.",
                        },
                        {
                            role: "user",
                            content: systemPrompt
                                ? `${systemPrompt}\n${prompt}`
                                : prompt,
                        },
                    ],
                }),
            },
        );

        const json = await res.json();
        return json?.choices?.[0]?.message?.content?.trim() || "";
    } catch (error) {
        throw error;
    }
};

export { groqChatCompletion };
