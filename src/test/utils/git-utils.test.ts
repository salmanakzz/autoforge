import * as vscode from "vscode";
import { updateGitInputBox } from "../../utils/git-utils";

const mockShowErrorMessage = jest.fn();

jest.mock("vscode", () => ({
    extensions: {
        getExtension: jest.fn(),
    },
    window: {
        showErrorMessage: (...args: any[]) => mockShowErrorMessage(...args),
    },
}));

describe("updateGitInputBox", () => {
    const getExtensionMock = vscode.extensions.getExtension as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ✅ extension not installed
    it("should return if git extension is not found", async () => {
        getExtensionMock.mockReturnValue(undefined);

        await updateGitInputBox("test message");

        expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });

    // ✅ active extension updates commit input
    it("should update git input box when repository selected", async () => {
        const inputBox = { value: "" };

        const mockApi = {
            repositories: [
                {
                    ui: { selected: true },
                    inputBox,
                },
            ],
        };

        const mockExtension = {
            isActive: true,
            exports: {
                getAPI: jest.fn().mockReturnValue(mockApi),
            },
        };

        getExtensionMock.mockReturnValue(mockExtension);

        await updateGitInputBox("commit msg");

        expect(inputBox.value).toBe("commit msg");
    });

    // ✅ inactive extension should activate first
    it("should activate extension if not active", async () => {
        const inputBox = { value: "" };

        const mockApi = {
            repositories: [
                {
                    ui: { selected: true },
                    inputBox,
                },
            ],
        };

        const activate = jest.fn().mockResolvedValue({
            getAPI: jest.fn().mockReturnValue(mockApi),
        });

        const mockExtension = {
            isActive: false,
            activate,
        };

        getExtensionMock.mockReturnValue(mockExtension);

        await updateGitInputBox("hello");

        expect(activate).toHaveBeenCalled();
        expect(inputBox.value).toBe("hello");
    });

    // ✅ no selected repository
    it("should show error if no repository selected", async () => {
        const mockApi = {
            repositories: [
                {
                    ui: { selected: false },
                    inputBox: { value: "" },
                },
            ],
        };

        const mockExtension = {
            isActive: true,
            exports: {
                getAPI: jest.fn().mockReturnValue(mockApi),
            },
        };

        getExtensionMock.mockReturnValue(mockExtension);

        await updateGitInputBox("msg");

        expect(mockShowErrorMessage).toHaveBeenCalledWith(
            "No active Git repository found.",
        );
    });
});
