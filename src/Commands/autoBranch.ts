import * as vscode from "vscode";
import { exec } from "child_process";

import { generateBranch } from "../GitOps/generateBranch";

export async function autoBranch() {
    const { name, cwd } = await generateBranch();

    if (!name || name.length > 200) {
        vscode.window.showErrorMessage("⚠️ Invalid branch name.");
        return;
    }

    const input = await vscode.window.showInputBox({
        value: name,
        prompt: "Edit your branch name",
    });
    if (input) {
        exec(`git checkout -b ${input}`, { cwd }, (err, stdout, stderr) => {
            if (err) {
                vscode.window.showErrorMessage(
                    `❌ Failed to create branch: ${stderr.trim()}`,
                );
                return;
            }

            vscode.window.showInformationMessage(`✅ Branch created: ${input}`);
        });
    }
}
