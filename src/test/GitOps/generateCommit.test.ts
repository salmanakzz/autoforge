import { generateCommit } from "../../GitOps/generateCommit";
import * as utils from "../../GitOps/utils";
import * as ai from "../../AI/aiProvider";

jest.mock("../../GitOps/utils");
jest.mock("../../AI/aiProvider");
jest.mock("vscode");

describe("generateCommit", () => {
    it("should return AI-generated commit message from git diff", async () => {
        (utils.getGitDiff as jest.Mock).mockResolvedValue({
            diff: "mock dif",
            cwd: "/mock/cwd",
        });
        (ai.generateCommitMessageFromDiff as jest.Mock).mockResolvedValue(
            "chore: update token logic"
        );

        const result = await generateCommit();
        expect(result).toHaveProperty("msg");
        expect(result).toHaveProperty("cwd");
        expect(result.msg).toBe("chore: update token logic");
        expect(result.cwd).toBe("/mock/cwd");
    });
});
