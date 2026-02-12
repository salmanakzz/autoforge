import * as vscode from "vscode";
import { autoCommit } from "../../Commands/autoCommit";
import { generateCommit } from "../../GitOps/generateCommit";
import { handleAutoCommitProcess } from "../../utils/vscode-ui";
import { updateGitInputBox } from "../../utils/git-utils";

jest.mock("vscode", () => ({
    window: {
        showErrorMessage: jest.fn(),
    },
}));

jest.mock("../../GitOps/generateCommit");
jest.mock("../../utils/vscode-ui");
jest.mock("../../utils/git-utils");

describe("autoCommit", () => {
    const mockMsg = "feat: new commit";
    const mockCwd = "/mock/project";

    beforeEach(() => {
        jest.clearAllMocks();

        (generateCommit as jest.Mock).mockResolvedValue({
            msg: mockMsg,
            cwd: mockCwd,
        });
    });

    it("should call handleAutoCommitProcess when section is 'cp'", async () => {
        await autoCommit("cp");

        expect(generateCommit).toHaveBeenCalled();
        expect(handleAutoCommitProcess).toHaveBeenCalledWith(mockMsg, mockCwd);
        expect(updateGitInputBox).not.toHaveBeenCalled();
    });

    it("should call updateGitInputBox when section is 'scm'", async () => {
        await autoCommit("scm");

        expect(generateCommit).toHaveBeenCalled();
        expect(updateGitInputBox).toHaveBeenCalledWith(mockMsg);
        expect(handleAutoCommitProcess).not.toHaveBeenCalled();
    });

    it("should show error message for invalid section", async () => {
        await autoCommit("invalid");

        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
            "🚫 Invalid section",
        );
        expect(handleAutoCommitProcess).not.toHaveBeenCalled();
        expect(updateGitInputBox).not.toHaveBeenCalled();
    });
});
