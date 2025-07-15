import { generateBranch } from "../../GitOps/generateBranch";
import * as utils from "../../GitOps/utils";
import * as ai from "../../AI/aiProvider";

jest.mock("../../GitOps/utils");
jest.mock("../../AI/aiProvider");
jest.mock("vscode");

describe("generateBranch", () => {
    it("should return AI-generated branch name from git diff", async () => {
        (utils.getGitDiff as jest.Mock).mockResolvedValue({
            diff: "mock dif",
            cwd: "/mock/cwd",
        });
        (ai.generateBranchNameFromDiff as jest.Mock).mockResolvedValue(
            "feature/mock-branch"
        );

        const result = await generateBranch();
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("cwd");
        expect(result.name).toBe("feature/mock-branch");
        expect(result.cwd).toBe("/mock/cwd");
    });
});
