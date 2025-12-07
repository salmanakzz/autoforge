const chatCompletion = async (
    prompt: string,
    systemPrompt?: string,
    model = "gpt-4"
): Promise<string> => {
    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    ...(systemPrompt
                        ? [{ role: "system", content: systemPrompt }]
                        : []),
                    { role: "user", content: prompt },
                ],
            }),
        });

        const json = await res.json();
        return json.choices?.[0]?.message?.content?.trim() || "";
    } catch (error) {
        throw error;
    }
};

export { chatCompletion };
