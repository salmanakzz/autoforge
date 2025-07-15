import * as vscode from "vscode";
import { generateCommit } from "../GitOps/generateCommit";

export async function autoCommit() {
    const msg = await generateCommit();
    const input = await vscode.window.showInputBox({
        value: msg,
        prompt: "Edit your commit message",
    });
    if (input) {
        const terminal = vscode.window.createTerminal("Git");
        terminal.show();
        terminal.sendText(`git commit -m "${input}"`);
        vscode.window.showInformationMessage(`Committed: ${input}`);
    }
}
