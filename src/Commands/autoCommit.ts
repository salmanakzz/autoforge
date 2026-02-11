import * as vscode from "vscode";
import { exec } from "child_process";
import { generateCommit } from "../GitOps/generateCommit";

export async function autoCommit() {
    const { msg, cwd } = await generateCommit();

    const formattedMsg = `\`${msg}\``;
    const input = await vscode.window.showInputBox({
        value: formattedMsg,
        prompt: "Edit your commit message",
    });
    if (input) {
        exec(
            `git commit -m "${input.replace(/"/g, '\\"')}"`,
            { cwd },
            (err, stdout, stderr) => {
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
            },
        );
    }
}
