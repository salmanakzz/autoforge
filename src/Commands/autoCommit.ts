import * as vscode from "vscode";
import { generateCommit } from "../GitOps/generateCommit";
import { handleAutoCommitProcess } from "../utils/vscode-ui";
import { updateGitInputBox } from "../utils/git-utils";

export async function autoCommit(section = "cp") {
    const { msg, cwd } = await generateCommit();

    if (!msg || msg.length > 200) {
        vscode.window.showErrorMessage("⚠️ Invalid commit message.");
        return;
    }

    switch (section) {
        case "cp":
            handleAutoCommitProcess(msg, cwd);
            break;
        case "scm":
            updateGitInputBox(msg);
            break;

        default:
            vscode.window.showErrorMessage(`🚫 Invalid section`);
            break;
    }
}
