import * as vscode from "vscode";
import { exec } from "child_process";
import { autoCommit } from "../../Commands/autoCommit"; // Adjust path to your file
import { generateCommit } from "../../GitOps/generateCommit";

// 1. Mock the dependencies
jest.mock("vscode", () => ({
    window: {
        showInputBox: jest.fn(),
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn(),
    },
}));
jest.mock("child_process");
jest.mock("../../GitOps/generateCommit");

describe("autoCommit", () => {
    const mockMsg = "feat: initial commit";
    const mockCwd = "/mock/path";

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mock return for generateCommit
        (generateCommit as jest.Mock).mockResolvedValue({
            msg: mockMsg,
            cwd: mockCwd,
        });
    });

    it("should successfully commit when user confirms the input box", async () => {
        // Arrange: Mock showInputBox to return the message
        (vscode.window.showInputBox as jest.Mock).mockResolvedValue(mockMsg);

        // Mock exec to simulate success (null error)
        (exec as unknown as jest.Mock).mockImplementation(
            (cmd, opts, callback) => {
                callback(null, "stdout success", "");
            },
        );

        // Act
        await autoCommit();

        // Assert
        expect(generateCommit).toHaveBeenCalled();
        expect(vscode.window.showInputBox).toHaveBeenCalledWith(
            expect.objectContaining({ value: mockMsg }),
        );
        expect(exec).toHaveBeenCalledWith(
            `git commit -m "${mockMsg}"`,
            { cwd: mockCwd },
            expect.any(Function),
        );
        expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
            expect.stringContaining("✅ Message commited"),
        );
    });

    it("should show error message if git commit fails", async () => {
        // Arrange
        (vscode.window.showInputBox as jest.Mock).mockResolvedValue(mockMsg);

        // Mock exec to simulate a git error
        const gitError = new Error("Git error");
        (exec as unknown as jest.Mock).mockImplementation(
            (cmd, opts, callback) => {
                callback(gitError, "", "fatal: not a git repository");
            },
        );

        // Act
        await autoCommit();

        // Assert
        expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
            expect.stringContaining(
                "❌ Failed to commit message: fatal: not a git repository",
            ),
        );
    });

    it("should do nothing if user cancels the input box", async () => {
        // Arrange: User hits Escape (returns undefined)
        (vscode.window.showInputBox as jest.Mock).mockResolvedValue(undefined);

        // Act
        await autoCommit();

        // Assert
        expect(exec).not.toHaveBeenCalled();
    });
});
