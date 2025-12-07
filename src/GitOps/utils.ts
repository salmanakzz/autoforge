import { exec } from "child_process";
import * as vscode from "vscode";

export function getGitDiff(): Promise<{ diff: string; cwd: string }> {
    return new Promise((resolve, reject) => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return reject("No workspace folder open");
        }

        const cwd = workspaceFolders[0].uri.fsPath;

        exec("git diff --staged", { cwd }, (err, stdout, stderr) => {
            if (err) {
                return reject(stderr || err.message);
            }

            if (!stdout || stdout.trim().length === 0) {
                return reject(
                    new Error(
                        "No staged changes found. Stage your files first."
                    )
                );
            }

            resolve({ diff: stdout, cwd });
        });
    });
}
