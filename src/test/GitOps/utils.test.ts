import { getGitDiff } from "../../GitOps/utils";
import { exec } from "child_process";
import * as vscode from "vscode";

jest.mock("child_process", () => ({
    exec: jest.fn(),
}));

jest.mock("vscode");

describe("getGitDiff", () => {
    const mockExec = exec as unknown as jest.Mock;

    beforeEach(() => {
        mockExec.mockReset();

        (vscode.workspace as any).workspaceFolders = [
            { uri: { fsPath: "/mock/cwd" } },
        ];
    });

    it("should resolve with stdout when git diff runs successfully", async () => {
        mockExec.mockImplementation((_cmd, _opts, cb) => {
            cb(null, "diff output", "");
        });

        const result = await getGitDiff();
        expect(result).toEqual({ diff: "diff output", cwd: "/mock/cwd" });
    });

    it("should reject with stderr when git diff fails", async () => {
        mockExec.mockImplementation((_cmd, _opts, cb) => {
            cb(new Error("fail"), "", "some error");
        });

        await expect(getGitDiff()).rejects.toBe("some error");
    });

    it("should reject if no workspace folder is open", async () => {
        (vscode.workspace as any).workspaceFolders = null;
        await expect(getGitDiff()).rejects.toBe("No workspace folder open");
    });
});
