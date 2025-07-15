import { generateCommit } from "../../GitOps/generateCommit";
import * as utils from "../../GitOps/utils";
import * as ai from "../../AI/aiProvider";

jest.mock("../../GitOps/utils");
jest.mock("../../AI/aiProvider");

describe("generateCommit", () => {
    it("should return AI-generated commit message from git diff", async () => {
        (utils.getGitDiff as jest.Mock).mockResolvedValue("mock diff");
        (ai.generateCommitMessageFromDiff as jest.Mock).mockResolvedValue(
            "chore: update token logic"
        );

        const result = await generateCommit();
        expect(result).toBe("chore: update token logic");
    });
});
