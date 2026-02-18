import * as vscode from "vscode";
import { groqChatCompletion } from "../../Services/groq";

jest.mock("vscode", () => ({
    workspace: {
        getConfiguration: jest.fn(),
    },
}));

global.fetch = jest.fn();

describe("groqChatCompletion", () => {
    const mockApiKey = "test-api-key";

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock VSCode configuration
        jest.spyOn(vscode.workspace, "getConfiguration").mockReturnValue({
            get: jest.fn().mockReturnValue(mockApiKey),
        } as any);
    });

    it("should return model response content", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => ({
                choices: [
                    {
                        message: {
                            content: "Hello from Groq",
                        },
                    },
                ],
            }),
        });

        const result = await groqChatCompletion({
            prompt: "Say hello",
        });

        expect(result).toBe("Hello from Groq");
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should combine systemPrompt and prompt", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => ({
                choices: [
                    {
                        message: {
                            content: "Combined response",
                        },
                    },
                ],
            }),
        });

        await groqChatCompletion({
            prompt: "User message",
            systemPrompt: "System instruction",
        });

        const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);

        // system role stays constant
        expect(body.messages[0].role).toBe("system");

        // combined prompt lives in USER message
        expect(body.messages[1].content).toContain("System instruction");
        expect(body.messages[1].content).toContain("User message");
    });

    it("should throw error if API key is missing", async () => {
        jest.spyOn(vscode.workspace, "getConfiguration").mockReturnValue({
            get: jest.fn().mockReturnValue(undefined),
        } as any);

        await expect(groqChatCompletion({ prompt: "Test" })).rejects.toThrow(
            "Groq API key is not set",
        );
    });

    it("should return empty string if no choices", async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => ({}),
        });

        const result = await groqChatCompletion({
            prompt: "Test",
        });

        expect(result).toBe("");
    });
});
