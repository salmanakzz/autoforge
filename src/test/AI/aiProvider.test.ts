import { callAIProvider } from "../../AI/aiProvider";

// You may use msw or mock fetch globally if needed

describe("callAIProvider", () => {
    beforeEach(() => {
        global.fetch = jest.fn().mockResolvedValue({
            json: () =>
                Promise.resolve({
                    choices: [
                        {
                            message: {
                                content: "AI suggestion",
                            },
                        },
                    ],
                }),
        }) as any;
    });

    it("should return AI-generated string from OpenAI API", async () => {
        const result = await callAIProvider({ prompt: "Say hi" });
        expect(result).toBe("AI suggestion");
    });
});
