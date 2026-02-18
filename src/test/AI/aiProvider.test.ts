import * as vscode from "vscode";
import {
    callAIProvider,
    generateBranchNameFromDiff,
    generateCommitMessageFromDiff,
} from "../../AI/aiProvider";

import { groqChatCompletion } from "../../Services/groq";
import { customChatCompletion } from "../../Services/custom";

import { sanitizeDiff } from "../../utils/sanitizeDiff";
import { sanitizeAIOutput } from "../../utils/sanitizeAIOutput";

/* ---------------- MOCKS ---------------- */

jest.mock("vscode", () => ({
    workspace: {
        getConfiguration: jest.fn(),
    },
}));

jest.mock("../../Services/groq");
jest.mock("../../Services/custom");

jest.mock("../../utils/sanitizeDiff");
jest.mock("../../utils/sanitizeAIOutput");

/* ---------------- HELPERS ---------------- */

const mockGetConfiguration = vscode.workspace.getConfiguration as jest.Mock;

const mockGroq = groqChatCompletion as jest.Mock;
const mockCustom = customChatCompletion as jest.Mock;
const mockSanitizeDiff = sanitizeDiff as jest.Mock;
const mockSanitizeOutput = sanitizeAIOutput as jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();

    mockSanitizeDiff.mockReturnValue({
        sanitized: "safe diff",
        sensitiveFileDetected: false,
    });

    mockSanitizeOutput.mockImplementation((v) => v);
});

/* =======================================================
   callAIProvider
======================================================= */

describe("callAIProvider", () => {
    test("throws when provider is not configured", async () => {
        mockGetConfiguration.mockReturnValue({
            get: () => undefined,
        });

        await expect(callAIProvider({ prompt: "diff" })).rejects.toThrow(
            "AI provider is not set",
        );
    });

    test("calls groq provider when selected", async () => {
        mockGetConfiguration.mockReturnValue({
            get: () => "groq",
        });

        mockGroq.mockResolvedValue("feat/auth-login");

        const result = await callAIProvider({
            prompt: "diff",
        });

        expect(mockGroq).toHaveBeenCalled();
        expect(result).toBe("feat/auth-login");
    });

    test("calls custom provider when selected", async () => {
        mockGetConfiguration.mockReturnValue({
            get: () => "custom",
        });

        mockCustom.mockResolvedValue("fix/api-error");

        const result = await callAIProvider({
            prompt: "diff",
        });

        expect(mockCustom).toHaveBeenCalled();
        expect(result).toBe("fix/api-error");
    });

    test("returns fallback branch when diff fully redacted", async () => {
        mockGetConfiguration.mockReturnValue({
            get: () => "groq",
        });

        mockSanitizeDiff.mockReturnValue({
            sanitized: "",
            sensitiveFileDetected: true,
        });

        const result = await callAIProvider({
            prompt: "diff",
        });

        expect(result).toBe("chore/update-configuration");
        expect(mockGroq).not.toHaveBeenCalled();
    });

    test("sanitizes AI output before returning", async () => {
        mockGetConfiguration.mockReturnValue({
            get: () => "groq",
        });

        mockGroq.mockResolvedValue("RAW OUTPUT");
        mockSanitizeOutput.mockReturnValue("clean-output");

        const result = await callAIProvider({
            prompt: "diff",
        });

        expect(mockSanitizeOutput).toHaveBeenCalledWith("RAW OUTPUT");
        expect(result).toBe("clean-output");
    });

    test("throws for unsupported provider", async () => {
        mockGetConfiguration.mockReturnValue({
            get: () => "unknown",
        });

        await expect(callAIProvider({ prompt: "diff" })).rejects.toThrow(
            "Unsupported AI provider",
        );
    });
});

/* =======================================================
   generateBranchNameFromDiff
======================================================= */

describe("generateBranchNameFromDiff", () => {
    test("delegates to callAIProvider", async () => {
        mockGetConfiguration.mockReturnValue({
            get: () => "groq",
        });

        mockGroq.mockResolvedValue("feat/booking-flow");

        const result = await generateBranchNameFromDiff("diff content");

        expect(result).toBe("feat/booking-flow");

        expect(mockGroq.mock.calls[0][0].prompt).toContain("Git Diff:");
    });
});

/* =======================================================
   generateCommitMessageFromDiff
======================================================= */

describe("generateCommitMessageFromDiff", () => {
    test("generates conventional commit message", async () => {
        mockGetConfiguration.mockReturnValue({
            get: () => "groq",
        });

        mockGroq.mockResolvedValue("fix(auth): handle token refresh failure");

        const result = await generateCommitMessageFromDiff("diff");

        expect(result).toBe("fix(auth): handle token refresh failure");

        expect(mockGroq.mock.calls[0][0].prompt).toContain(
            "Conventional Commit",
        );
    });
});
