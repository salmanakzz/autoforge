import * as vscode from "vscode";
import { generateCommitMessageFromDiff } from "./aiProvider";

export const inlineSuggestProvider: vscode.InlineCompletionItemProvider = {
    async provideInlineCompletionItems(document, position) {
        const line = document.lineAt(position.line).text;
        if (!line.trim().startsWith("//")) return;

        const suggestion = await generateCommitMessageFromDiff("// " + line);

        return {
            items: [
                {
                    insertText: suggestion,
                    range: new vscode.Range(position, position),
                },
            ],
        };
    },
};
