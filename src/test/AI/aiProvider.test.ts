import * as vscode from "vscode";
import {
    callAIProvider,
    generateBranchNameFromDiff,
    generateCommitMessageFromDiff,
} from "../../AI/aiProvider";

import { groqChatCompletion } from "../../Services/groq";
import { customChatCompletion } from "../../Services/custom";
import { sanitizeAIOutput } from "../../utils/sanitizeAIOutput";
import { sanitizeDiff, isEmptyDiff } from "../../utils/sanitizeDiff";

/* -------------------------------------------------------------------------- */
/*                                  MOCKS                                     */
/* -------------------------------------------------------------------------- */

jest.mock("vscode", () => ({
    workspace: {
        getConfiguration: jest.fn(),
    },
}));

jest.mock("../../Services/groq", () => ({
    groqChatCompletion: jest.fn(),
}));

jest.mock("../../Services/custom", () => ({
    customChatCompletion: jest.fn(),
}));

jest.mock("../../utils/sanitizeAIOutput", () => ({
    sanitizeAIOutput: jest.fn(),
}));

jest.mock("../../utils/sanitizeDiff", () => ({
    sanitizeDiff: jest.fn(),
    isEmptyDiff: jest.fn(),
}));

const mockGetConfiguration = vscode.workspace.getConfiguration as jest.Mock;

const mockGroq = groqChatCompletion as jest.Mock;
const mockCustom = customChatCompletion as jest.Mock;
const mockSanitizeAIOutput = sanitizeAIOutput as jest.Mock;
const mockSanitizeDiff = sanitizeDiff as jest.Mock;
const mockIsEmptyDiff = isEmptyDiff as jest.Mock;

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function setProvider(provider: "groq" | "custom") {
    mockGetConfiguration.mockReturnValue({
        get: jest.fn().mockReturnValue(provider),
    });
}

/* -------------------------------------------------------------------------- */
/*                                   TESTS                                    */
/* -------------------------------------------------------------------------- */

describe("callAIProvider", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockSanitizeDiff.mockReturnValue({
            sanitized: "clean diff",
            sensitiveFileDetected: false,
        });

        mockIsEmptyDiff.mockReturnValue(false);
        mockSanitizeAIOutput.mockImplementation((v) => v);
    });

    it("calls groq provider when selected", async () => {
        setProvider("groq");

        mockGroq.mockResolvedValue("feat/add-login");

        const result = await callAIProvider({
            prompt: "diff",
        });

        expect(mockGroq).toHaveBeenCalled();
        expect(result).toBe("feat/add-login");
    });

    it("calls custom provider when selected", async () => {
        setProvider("custom");

        mockCustom.mockResolvedValue("fix/payment-bug");

        const result = await callAIProvider({
            prompt: "diff",
        });

        expect(mockCustom).toHaveBeenCalled();
        expect(result).toBe("fix/payment-bug");
    });

    it("sanitizes AI output", async () => {
        setProvider("groq");

        mockGroq.mockResolvedValue("RAW OUTPUT");
        mockSanitizeAIOutput.mockReturnValue("cleaned-output");

        const result = await callAIProvider({
            prompt: "diff",
        });

        expect(mockSanitizeAIOutput).toHaveBeenCalledWith("RAW OUTPUT");
        expect(result).toBe("cleaned-output");
    });

    it("returns fallback branch when sensitive diff removed", async () => {
        setProvider("groq");

        mockSanitizeDiff.mockReturnValue({
            sanitized: "",
            sensitiveFileDetected: true,
        });

        mockIsEmptyDiff.mockReturnValue(true);

        const result = await callAIProvider({
            prompt: "secret diff",
        });

        expect(result).toBe("chore/update-configuration");
        expect(mockGroq).not.toHaveBeenCalled();
    });

    it("throws error when provider not configured", async () => {
        mockGetConfiguration.mockReturnValue({
            get: jest.fn().mockReturnValue(undefined),
        });

        await expect(callAIProvider({ prompt: "diff" })).rejects.toThrow(
            "AI provider is not set",
        );
    });

    it("throws error for unsupported provider", async () => {
        mockGetConfiguration.mockReturnValue({
            get: jest.fn().mockReturnValue("unknown"),
        });

        await expect(callAIProvider({ prompt: "diff" })).rejects.toThrow(
            "Unsupported AI provider",
        );
    });
});

/* -------------------------------------------------------------------------- */
/*                     generateBranchNameFromDiff                             */
/* -------------------------------------------------------------------------- */

describe("generateBranchNameFromDiff", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setProvider("groq");

        mockSanitizeDiff.mockReturnValue({
            sanitized: "diff",
            sensitiveFileDetected: false,
        });

        mockIsEmptyDiff.mockReturnValue(false);
        mockSanitizeAIOutput.mockImplementation((v) => v);
    });

    it("generates branch name using AI provider", async () => {
        mockGroq.mockResolvedValue("feat/add-checkout");

        const result = await generateBranchNameFromDiff("diff");

        expect(result).toBe("feat/add-checkout");
        expect(mockGroq).toHaveBeenCalled();
    });
});

/* -------------------------------------------------------------------------- */
/*                   generateCommitMessageFromDiff                            */
/* -------------------------------------------------------------------------- */

describe("generateCommitMessageFromDiff", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setProvider("groq");

        mockSanitizeDiff.mockReturnValue({
            sanitized: "diff",
            sensitiveFileDetected: false,
        });

        mockIsEmptyDiff.mockReturnValue(false);
        mockSanitizeAIOutput.mockImplementation((v) => v);
    });

    it("generates conventional commit message", async () => {
        mockGroq.mockResolvedValue("fix(auth): resolve token expiry");

        const result = await generateCommitMessageFromDiff("diff");

        expect(result).toBe("fix(auth): resolve token expiry");
        expect(mockGroq).toHaveBeenCalled();
    });
});
