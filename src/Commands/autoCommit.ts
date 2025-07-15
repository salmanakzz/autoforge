import * as vscode from "vscode";
import { exec } from "child_process";
import { generateCommit } from "../GitOps/generateCommit";

export async function autoCommit() {
    const { msg, cwd } = await generateCommit();
    const input = await vscode.window.showInputBox({
        value: msg,
        prompt: "Edit your commit message",
    });
    if (input) {
        exec(`git commit -m "${input}"`, { cwd }, (err, stdout, stderr) => {
            if (err) {
                vscode.window.showErrorMessage(
                    `❌ Failed to commit message: ${stderr.trim()}`
                );
                return;
            }

            vscode.window.showInformationMessage(
                `✅ Message commited: ${input}`
            );
        });
    }
}
