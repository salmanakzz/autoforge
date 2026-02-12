import * as vscode from "vscode";
import { exec } from "child_process";

export async function handleAutoCommitProcess(
    msg: string,
    cwd: string,
): Promise<void> {
    const input = await vscode.window.showInputBox({
        value: msg,
        prompt: "Edit your commit message",
    });
    if (input) {
        exec(`git commit -m "${input}"`, { cwd }, (err, stdout, stderr) => {
            if (err) {
                const errorMessage =
                    stderr?.trim() || stdout?.trim() || err.message;
                vscode.window.showErrorMessage(
                    `❌ Failed to commit message: ${errorMessage}`,
                );
                return;
            }

            vscode.window.showInformationMessage(
                `✅ Message commited: ${input}`,
            );
        });
    }
}
