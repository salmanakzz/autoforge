import { inlineSuggestProvider } from "../../AI/inlineSuggest";
import * as vscode from "vscode";
import { generateCommitMessageFromDiff } from "../../AI/aiProvider";

jest.mock("vscode");
jest.mock("../../AI/aiProvider");

const mockContext = {} as any;
const mockToken = {
    isCancellationRequested: false,
    onCancellationRequested: jest.fn(),
} as any;

describe("inlineSuggestProvider", () => {
    const mockedGenerate = generateCommitMessageFromDiff as jest.Mock;

    const mockPosition = {
        line: 0,
        character: 5,
    };

    const createMockDocument = (text: string) => ({
        lineAt: jest.fn().mockReturnValue({
            text,
        }),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should return undefined if line does not start with //", async () => {
        const document = createMockDocument("normal code");

        const result = await inlineSuggestProvider.provideInlineCompletionItems(
            document as any,
            mockPosition as any,
            mockContext,
            mockToken,
        );

        expect(result).toBeUndefined();
        expect(mockedGenerate).not.toHaveBeenCalled();
    });

    it("should call AI provider when line starts with //", async () => {
        mockedGenerate.mockResolvedValue("Generated commit message");

        const document = createMockDocument("// fix login bug");

        await inlineSuggestProvider.provideInlineCompletionItems(
            document as any,
            mockPosition as any,
            mockContext,
            mockToken,
        );

        expect(mockedGenerate).toHaveBeenCalledWith("// // fix login bug");
    });

    it("should return inline completion items", async () => {
        mockedGenerate.mockResolvedValue("AI suggestion");

        const document = createMockDocument("// add feature");

        const result = await inlineSuggestProvider.provideInlineCompletionItems(
            document as any,
            mockPosition as any,
            mockContext,
            mockToken,
        );
        const list = result as vscode.InlineCompletionList;

        expect(list).toBeDefined();
        expect(list?.items.length).toBe(1);

        expect(list?.items[0]).toMatchObject({
            insertText: "AI suggestion",
        });
    });

    it("should create vscode.Range with correct position", async () => {
        mockedGenerate.mockResolvedValue("AI suggestion");

        const document = createMockDocument("// test");

        const result = await inlineSuggestProvider.provideInlineCompletionItems(
            document as any,
            mockPosition as any,
            mockContext,
            mockToken,
        );

        const list = result as vscode.InlineCompletionList;

        expect(list?.items[0].range).toBeInstanceOf(vscode.Range);
    });
});
