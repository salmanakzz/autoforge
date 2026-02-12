import * as vscode from "vscode";
import { generateCommit } from "../GitOps/generateCommit";
import { handleAutoCommitProcess } from "../utils/vscode-ui";
import { updateGitInputBox } from "../utils/git-utils";

export async function autoCommit(section = "cp") {
    const { msg, cwd } = await generateCommit();

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
