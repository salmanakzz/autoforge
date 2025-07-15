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
            if (err) return reject(stderr || err.message);
            resolve({ diff: stdout, cwd });
        });
    });
}
