import * as vscode from "vscode";

export async function updateGitInputBox(msg: string): Promise<void> {
    const extension = vscode.extensions.getExtension("vscode.git");
    if (!extension) {
        return;
    }

    // 2. Activate it and get the API
    const gitExtension = extension.isActive
        ? extension.exports
        : await extension.activate();

    const api = gitExtension.getAPI(1);

    const repository = api.repositories.find(
        (r: { ui: { selected: any } }) => r.ui.selected,
    );

    if (repository) {
        repository.inputBox.value = msg;
    } else {
        vscode.window.showErrorMessage("No active Git repository found.");
    }
}
