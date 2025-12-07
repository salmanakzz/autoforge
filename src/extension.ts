// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { autoBranch } from "./Commands/autoBranch";
import { autoCommit } from "./Commands/autoCommit";
import { registerScmIntegration } from "./Commands/scmIntegration";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log("✅ AutoForge activated");

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json

    // Register Command Palette commands
    context.subscriptions.push(
        vscode.commands.registerCommand("autoforge.autoBranch", autoBranch),
        vscode.commands.registerCommand("autoforge.autoCommit", autoCommit)
    );

    // Register Source Control view integration
    // This adds buttons/actions to the Source Control view for auto-commit and auto-branch
    registerScmIntegration(context);
}

// This method is called when your extension is deactivated
export function deactivate() {}
