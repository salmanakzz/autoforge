import * as vscode from "vscode";
import { autoBranch } from "../../Commands/autoBranch";
import { generateBranch } from "../../GitOps/generateBranch";
import { exec } from "child_process";

jest.mock("../../GitOps/generateBranch");
jest.mock("child_process");

const mockShowInputBox = jest.fn();
const mockShowErrorMessage = jest.fn();
const mockShowInformationMessage = jest.fn();

jest.mock("vscode", () => ({
    window: {
        showInputBox: (...args: any[]) => mockShowInputBox(...args),
        showErrorMessage: (...args: any[]) => mockShowErrorMessage(...args),
        showInformationMessage: (...args: any[]) =>
            mockShowInformationMessage(...args),
    },
}));

describe("autoBranch", () => {
    const mockedGenerateBranch = generateBranch as jest.Mock;
    const mockedExec = exec as unknown as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ✅ invalid branch name
    it("should show error if branch name invalid", async () => {
        mockedGenerateBranch.mockResolvedValue({
            name: "",
            cwd: "/repo",
        });

        await autoBranch();

        expect(mockShowErrorMessage).toHaveBeenCalledWith(
            "⚠️ Invalid branch name.",
        );
        expect(mockShowInputBox).not.toHaveBeenCalled();
    });

    // ✅ user cancels input
    it("should do nothing if user cancels input", async () => {
        mockedGenerateBranch.mockResolvedValue({
            name: "feature/login",
            cwd: "/repo",
        });

        mockShowInputBox.mockResolvedValue(undefined);

        await autoBranch();

        expect(mockedExec).not.toHaveBeenCalled();
    });

    // ✅ successful branch creation
    it("should create branch successfully", async () => {
        mockedGenerateBranch.mockResolvedValue({
            name: "feature/login",
            cwd: "/repo",
        });

        mockShowInputBox.mockResolvedValue("feature/login");

        mockedExec.mockImplementation(
            (_cmd: string, _opts: any, callback: Function) => {
                callback(null, "ok", "");
            },
        );

        await autoBranch();

        expect(mockedExec).toHaveBeenCalledWith(
            "git checkout -b feature/login",
            { cwd: "/repo" },
            expect.any(Function),
        );

        expect(mockShowInformationMessage).toHaveBeenCalledWith(
            "✅ Branch created: feature/login",
        );
    });

    // ✅ git error case
    it("should show error if git command fails", async () => {
        mockedGenerateBranch.mockResolvedValue({
            name: "feature/login",
            cwd: "/repo",
        });

        mockShowInputBox.mockResolvedValue("feature/login");

        mockedExec.mockImplementation(
            (_cmd: string, _opts: any, callback: Function) => {
                callback(new Error("fail"), "", "git error");
            },
        );

        await autoBranch();

        expect(mockShowErrorMessage).toHaveBeenCalledWith(
            "❌ Failed to create branch: git error",
        );
    });
});
