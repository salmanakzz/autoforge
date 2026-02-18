import { customChatCompletion } from "../../Services/custom";

import * as smartDesc from "../../utils/generateSmartDescription";
import * as branchGen from "../../utils/generateSmartBranchName ";
import { Signal } from "../../utils/types";

jest.mock("../../utils/generateSmartDescription.ts");
jest.mock("../../utils/generateSmartBranchName .ts");

const mockedParseDiff = smartDesc.parseDiffContext as jest.MockedFunction<
    typeof smartDesc.parseDiffContext
>;

const mockedAnalyzeSignals = smartDesc.analyzeSignals as jest.MockedFunction<
    typeof smartDesc.analyzeSignals
>;

const mockedGenerateDescription =
    smartDesc.generateSmartDescription as jest.MockedFunction<
        typeof smartDesc.generateSmartDescription
    >;

const mockedGenerateBranch =
    branchGen.generateSmartBranchName as jest.MockedFunction<
        typeof branchGen.generateSmartBranchName
    >;

describe("customChatCompletion", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const fakeContext = {
        fileNames: ["src/cart/addToCart.ts"],
    } as any;

    const fakeSignals = [
        {
            kind: "function",
            subjects: ["addToCart"],
            verb: "implement",
            score: 8,
        },
    ] satisfies Signal[];

    // ─────────────────────────────────────────────
    // ✅ Commit message generation
    // ─────────────────────────────────────────────
    it("should generate commit message output", async () => {
        mockedParseDiff.mockReturnValue(fakeContext);
        mockedAnalyzeSignals.mockReturnValue(fakeSignals);
        mockedGenerateDescription.mockReturnValue("implement addToCart logic");

        const result = await customChatCompletion({
            prompt: `
            Commit message please
            Diff:
            diff --git a/file.ts b/file.ts
            + function addToCart(){}
            `,
        });

        expect(result).toBe("feat(cart): implement addToCart logic");

        expect(mockedParseDiff).toHaveBeenCalled();
        expect(mockedAnalyzeSignals).toHaveBeenCalledWith(fakeContext);
        expect(mockedGenerateDescription).toHaveBeenCalled();
    });

    // ─────────────────────────────────────────────
    // ✅ Branch name generation
    // ─────────────────────────────────────────────
    it("should generate branch name when requested", async () => {
        mockedParseDiff.mockReturnValue(fakeContext);
        mockedAnalyzeSignals.mockReturnValue(fakeSignals);

        mockedGenerateDescription.mockReturnValue("implement addToCart logic");

        mockedGenerateBranch.mockReturnValue("feat/cart-add-cart");

        const result = await customChatCompletion({
            prompt: `
            Create branch name
            Diff:
            diff --git a/file.ts b/file.ts
            + function addToCart(){}
            `,
        });

        expect(mockedGenerateBranch).toHaveBeenCalledWith(
            fakeSignals,
            "cart",
            "feat",
        );

        expect(result).toBe("feat/cart-add-cart");
    });

    // ─────────────────────────────────────────────
    // ✅ Defaults to commit mode
    // ─────────────────────────────────────────────
    it("should default to commit mode when ambiguous", async () => {
        mockedParseDiff.mockReturnValue(fakeContext);
        mockedAnalyzeSignals.mockReturnValue(fakeSignals);
        mockedGenerateDescription.mockReturnValue("implement feature");

        const result = await customChatCompletion({
            prompt: `
            Here is a diff:
            diff --git a/a.ts b/a.ts
            + new code
            `,
        });

        expect(result.startsWith("feat(")).toBe(true);
    });

    // ─────────────────────────────────────────────
    // ✅ Empty diff fallback
    // ─────────────────────────────────────────────
    it("should return fallback when diff is empty", async () => {
        const result = await customChatCompletion({
            prompt: "commit message please",
        });

        expect(result).toBe("chore: empty diff");
    });

    // ─────────────────────────────────────────────
    // ✅ Type inference priority (optimize → perf)
    // ─────────────────────────────────────────────
    it("should infer perf type from optimize signal", async () => {
        mockedParseDiff.mockReturnValue(fakeContext);

        mockedAnalyzeSignals.mockReturnValue([
            {
                kind: "performance",
                subjects: ["db query"],
                verb: "optimize",
                score: 9,
            },
        ]);

        mockedGenerateDescription.mockReturnValue("optimize db query");

        const result = await customChatCompletion({
            prompt: `
            commit message
            Diff:
            diff --git a/db.ts b/db.ts
            + optimized query
            `,
        });

        expect(result.startsWith("perf(")).toBe(true);
    });

    // ─────────────────────────────────────────────
    // ✅ Scope inference from file path
    // ─────────────────────────────────────────────
    it("should infer scope from file path domain", async () => {
        mockedParseDiff.mockReturnValue({
            fileNames: ["src/auth/loginHandler.ts"],
        } as any);

        mockedAnalyzeSignals.mockReturnValue(fakeSignals);
        mockedGenerateDescription.mockReturnValue("implement login handler");

        const result = await customChatCompletion({
            prompt: `
            commit message
            Diff:
            diff --git a/login.ts b/login.ts
            + login code
            `,
        });

        expect(result.includes("(auth)")).toBe(true);
    });
});
