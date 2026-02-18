import * as vscode from "vscode";
import { exec } from "child_process";
import { handleAutoCommitProcess } from "../../utils/vscode-ui";

jest.mock("child_process", () => ({
    exec: jest.fn(),
}));

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

describe("handleAutoCommitProcess", () => {
    const mockedExec = exec as unknown as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    // ✅ user cancels input
    it("should do nothing if user cancels input", async () => {
        mockShowInputBox.mockResolvedValue(undefined);

        await handleAutoCommitProcess("msg", "/repo");

        await new Promise(process.nextTick);

        expect(mockedExec).not.toHaveBeenCalled();
    });

    // ✅ successful commit
    it("should execute git commit and show success message", async () => {
        mockShowInputBox.mockResolvedValue("feat: add login");
        mockedExec.mockImplementation((_c, _o, cb) => {
            cb(null, "success", "");
            return {} as any;
        });

        await handleAutoCommitProcess("msg", "/repo");

        await new Promise(process.nextTick);

        expect(mockedExec).toHaveBeenCalledWith(
            'git commit -m "feat: add login"',
            { cwd: "/repo" },
            expect.any(Function),
        );

        expect(mockShowInformationMessage).toHaveBeenCalledWith(
            "✅ Message commited: feat: add login",
        );
    });

    // ✅ git error using stderr
    it("should show error message when git fails with stderr", async () => {
        mockShowInputBox.mockResolvedValue("feat: add login");

        mockedExec.mockImplementation(
            (_cmd: string, _opts: any, callback: Function) => {
                callback(new Error("fail"), "", "git error");
                return {} as any;
            },
        );

        await handleAutoCommitProcess("msg", "/repo");

        await new Promise(process.nextTick);

        expect(mockShowErrorMessage).toHaveBeenCalledWith(
            "❌ Failed to commit message: git error",
        );
    });

    // ✅ git error fallback to stdout
    it("should fallback to stdout when stderr empty", async () => {
        mockShowInputBox.mockResolvedValue("feat: add login");

        mockedExec.mockImplementation(
            (_cmd: string, _opts: any, callback: Function) => {
                callback(new Error("fail"), "stdout error", "");
                return {} as any;
            },
        );

        await handleAutoCommitProcess("msg", "/repo");

        await new Promise(process.nextTick);

        expect(mockShowErrorMessage).toHaveBeenCalledWith(
            "❌ Failed to commit message: stdout error",
        );
    });

    // ✅ git error fallback to error message
    it("should fallback to error.message if stdout/stderr empty", async () => {
        mockShowInputBox.mockResolvedValue("feat: add login");

        mockedExec.mockImplementation(
            (_cmd: string, _opts: any, callback: Function) => {
                callback(new Error("unknown error"), "", "");
                return {} as any;
            },
        );

        await handleAutoCommitProcess("msg", "/repo");

        await new Promise(process.nextTick);

        expect(mockShowErrorMessage).toHaveBeenCalledWith(
            "❌ Failed to commit message: unknown error",
        );
    });
});
