import { registerScmIntegration } from "../../Commands/scmIntegration";
import { autoCommit } from "../../Commands/autoCommit";
import { autoBranch } from "../../Commands/autoBranch";
import * as vscode from "vscode";

// Mock the command modules
jest.mock("../../Commands/autoCommit");
jest.mock("../../Commands/autoBranch");
jest.mock("vscode");

describe("registerScmIntegration", () => {
    let mockContext: vscode.ExtensionContext;
    let mockRegisterCommand: jest.Mock;
    let mockShowErrorMessage: jest.Mock;
    let mockShowInformationMessage: jest.Mock;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup vscode mocks
        mockRegisterCommand = jest.fn();
        mockShowErrorMessage = jest.fn();
        mockShowInformationMessage = jest.fn();

        // Properly setup vscode mock structure
        (vscode as any).commands = {
            registerCommand: mockRegisterCommand,
        };
        (vscode as any).window = {
            showErrorMessage: mockShowErrorMessage,
            showInformationMessage: mockShowInformationMessage,
        };

        // Setup ExtensionContext mock
        mockContext = {
            subscriptions: [],
        } as unknown as vscode.ExtensionContext;
    });

    it("should register all three SCM commands", () => {
        registerScmIntegration(mockContext);

        // Verify that registerCommand was called 3 times
        expect(mockRegisterCommand).toHaveBeenCalledTimes(3);

        // Verify the command IDs
        expect(mockRegisterCommand).toHaveBeenCalledWith(
            "autoforge.scm.autoCommit",
            expect.any(Function)
        );
        expect(mockRegisterCommand).toHaveBeenCalledWith(
            "autoforge.scm.autoBranch",
            expect.any(Function)
        );
        expect(mockRegisterCommand).toHaveBeenCalledWith(
            "autoforge.scm.autoCommitAndBranch",
            expect.any(Function)
        );
    });

    it("should add registered commands to context subscriptions", () => {
        const initialLength = mockContext.subscriptions.length;
        registerScmIntegration(mockContext);

        // Should add 3 commands to subscriptions
        expect(mockContext.subscriptions.length).toBe(initialLength + 3);
    });

    describe("autoforge.scm.autoCommit command", () => {
        it("should call autoCommit function when command is executed", async () => {
            (autoCommit as jest.Mock).mockResolvedValue(undefined);

            registerScmIntegration(mockContext);

            // Get the registered command handler
            const commandHandler = mockRegisterCommand.mock.calls.find(
                (call) => call[0] === "autoforge.scm.autoCommit"
            )?.[1];

            expect(commandHandler).toBeDefined();

            // Execute the command
            await commandHandler();

            // Verify autoCommit was called
            expect(autoCommit).toHaveBeenCalledTimes(1);
            expect(mockShowErrorMessage).not.toHaveBeenCalled();
        });

        it("should show error message when autoCommit fails", async () => {
            const error = new Error("Commit failed");
            (autoCommit as jest.Mock).mockRejectedValue(error);

            registerScmIntegration(mockContext);

            const commandHandler = mockRegisterCommand.mock.calls.find(
                (call) => call[0] === "autoforge.scm.autoCommit"
            )?.[1];

            await commandHandler();

            expect(autoCommit).toHaveBeenCalledTimes(1);
            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                "Failed to auto commit: Commit failed"
            );
        });

        it("should handle non-Error exceptions", async () => {
            (autoCommit as jest.Mock).mockRejectedValue("String error");

            registerScmIntegration(mockContext);

            const commandHandler = mockRegisterCommand.mock.calls.find(
                (call) => call[0] === "autoforge.scm.autoCommit"
            )?.[1];

            await commandHandler();

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                "Failed to auto commit: String error"
            );
        });
    });

    describe("autoforge.scm.autoBranch command", () => {
        it("should call autoBranch function when command is executed", async () => {
            (autoBranch as jest.Mock).mockResolvedValue(undefined);

            registerScmIntegration(mockContext);

            const commandHandler = mockRegisterCommand.mock.calls.find(
                (call) => call[0] === "autoforge.scm.autoBranch"
            )?.[1];

            expect(commandHandler).toBeDefined();

            await commandHandler();

            expect(autoBranch).toHaveBeenCalledTimes(1);
            expect(mockShowErrorMessage).not.toHaveBeenCalled();
        });

        it("should show error message when autoBranch fails", async () => {
            const error = new Error("Branch creation failed");
            (autoBranch as jest.Mock).mockRejectedValue(error);

            registerScmIntegration(mockContext);

            const commandHandler = mockRegisterCommand.mock.calls.find(
                (call) => call[0] === "autoforge.scm.autoBranch"
            )?.[1];

            await commandHandler();

            expect(autoBranch).toHaveBeenCalledTimes(1);
            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                "Failed to auto branch: Branch creation failed"
            );
        });
    });

    describe("autoforge.scm.autoCommitAndBranch command", () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it("should call autoBranch then autoCommit when command is executed", async () => {
            (autoBranch as jest.Mock).mockResolvedValue(undefined);
            (autoCommit as jest.Mock).mockResolvedValue(undefined);

            registerScmIntegration(mockContext);

            const commandHandler = mockRegisterCommand.mock.calls.find(
                (call) => call[0] === "autoforge.scm.autoCommitAndBranch"
            )?.[1];

            expect(commandHandler).toBeDefined();

            // Execute the command
            const promise = commandHandler();

            // Fast-forward timers to skip the delay and run all pending timers
            jest.advanceTimersByTime(500);
            await jest.runAllTimersAsync();
            
            await promise;

            // Verify both functions were called in order
            expect(autoBranch).toHaveBeenCalledTimes(1);
            expect(autoCommit).toHaveBeenCalledTimes(1);
            // Verify order: autoBranch should be called before autoCommit
            const branchCallOrder = (autoBranch as jest.Mock).mock.invocationCallOrder[0];
            const commitCallOrder = (autoCommit as jest.Mock).mock.invocationCallOrder[0];
            expect(branchCallOrder).toBeLessThan(commitCallOrder);
            expect(mockShowErrorMessage).not.toHaveBeenCalled();
        });

        it("should show error message when autoBranch fails in combined command", async () => {
            const error = new Error("Branch failed");
            (autoBranch as jest.Mock).mockRejectedValue(error);
            (autoCommit as jest.Mock).mockResolvedValue(undefined);

            registerScmIntegration(mockContext);

            const commandHandler = mockRegisterCommand.mock.calls.find(
                (call) => call[0] === "autoforge.scm.autoCommitAndBranch"
            )?.[1];

            await commandHandler();

            expect(autoBranch).toHaveBeenCalledTimes(1);
            expect(autoCommit).not.toHaveBeenCalled();
            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                "Failed to auto commit and branch: Branch failed"
            );
        });

        it("should show error message when autoCommit fails in combined command", async () => {
            (autoBranch as jest.Mock).mockResolvedValue(undefined);
            const error = new Error("Commit failed");
            (autoCommit as jest.Mock).mockRejectedValue(error);

            registerScmIntegration(mockContext);

            const commandHandler = mockRegisterCommand.mock.calls.find(
                (call) => call[0] === "autoforge.scm.autoCommitAndBranch"
            )?.[1];

            const promise = commandHandler();
            jest.advanceTimersByTime(500);
            await jest.runAllTimersAsync();
            await promise;

            expect(autoBranch).toHaveBeenCalledTimes(1);
            expect(autoCommit).toHaveBeenCalledTimes(1);
            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                "Failed to auto commit and branch: Commit failed"
            );
        });
    });

    it("should log success messages to console", () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation();

        registerScmIntegration(mockContext);

        expect(consoleSpy).toHaveBeenCalledWith(
            "✅ AutoForge SCM integration registered"
        );
        expect(consoleSpy).toHaveBeenCalledWith(
            "   - Auto Commit command available in Source Control view"
        );
        expect(consoleSpy).toHaveBeenCalledWith(
            "   - Auto Branch command available in Source Control view"
        );
        expect(consoleSpy).toHaveBeenCalledWith(
            "   - Auto Commit & Branch command available in Source Control view"
        );

        consoleSpy.mockRestore();
    });
});

