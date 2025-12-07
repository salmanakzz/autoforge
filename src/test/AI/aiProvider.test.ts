import { callAIProvider } from "../../AI/aiProvider";

jest.mock("../../AI/aiProvider", () => ({
    callAIProvider: jest.fn(() => Promise.resolve("AI suggestion")),
}));

describe("callAIProvider", () => {
    // beforeEach(() => {
    //     global.fetch = jest.fn().mockResolvedValue({
    //         json: () =>
    //             Promise.resolve({
    //                 choices: [
    //                     {
    //                         message: {
    //                             content: "AI suggestion",
    //                         },
    //                     },
    //                 ],
    //             }),
    //     }) as any;
    // });

    it("should return AI-generated string from OpenAI API", async () => {
        const result = await callAIProvider({ prompt: "Say hi" });
        expect(result).toBe("AI suggestion");
    });
});
