import * as vscode from "vscode";
import { autoCommit } from "./autoCommit";
import { autoBranch } from "./autoBranch";

/**
 * Integrates AutoForge with VS Code's Source Control view.
 * Adds "Auto Commit" and "Auto Branch" actions to the Git SCM provider.
 *
 * This function registers commands that are triggered from buttons/actions
 * in the Source Control view. The buttons are defined in package.json
 * menu contributions (scm/title and scm/sourceControl).
 */
export function registerScmIntegration(context: vscode.ExtensionContext) {
    // Register commands that will be triggered from the Source Control view
    // These commands are referenced in package.json's menu contributions

    /**
     * Command: Auto Commit
     * Generates an AI commit message and commits staged changes
     */
    const autoCommitCommand = vscode.commands.registerCommand(
        "autoforge.scm.autoCommit",
        async () => {
            try {
                await autoCommit("scm");
                // Note: The commit message input box will be cleared automatically
                // by VS Code after a successful commit
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Failed to auto commit: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
        },
    );

    /**
     * Command: Auto Branch
     * Generates an AI branch name and creates a new branch
     */
    const autoBranchCommand = vscode.commands.registerCommand(
        "autoforge.scm.autoBranch",
        async () => {
            try {
                await autoBranch();
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Failed to auto branch: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
        },
    );

    /**
     * Command: Auto Commit & Branch
     * Creates a new branch and then commits changes in one action
     */
    const autoCommitAndBranchCommand = vscode.commands.registerCommand(
        "autoforge.scm.autoCommitAndBranch",
        async () => {
            try {
                // First create branch, then commit
                await autoBranch();
                // Small delay to ensure branch is created and Git state is updated
                await new Promise((resolve) => setTimeout(resolve, 500));
                await autoCommit("scm");
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Failed to auto commit and branch: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
        },
    );

    // Add to subscriptions for cleanup
    context.subscriptions.push(
        autoCommitCommand,
        autoBranchCommand,
        autoCommitAndBranchCommand,
    );

    console.log("✅ AutoForge SCM integration registered");
    console.log("   - Auto Commit command available in Source Control view");
    console.log("   - Auto Branch command available in Source Control view");
    console.log(
        "   - Auto Commit & Branch command available in Source Control view",
    );
}
