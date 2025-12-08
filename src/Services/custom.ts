import * as path from "path";

interface CustomChatOptions {
    prompt: string;
    systemPrompt?: string;
}

/**
 * A deterministic fallback version of chatCompletion
 * when AI is disabled. Produces a conventional commit
 * message or branch name based on heuristic parsing.
 */
export async function customChatCompletion({
    prompt,
}: CustomChatOptions): Promise<string> {
    // Extract diff from prompt
    const diffMatch = prompt.match(/Diff:\s*([\s\S]*)$/);
    const diff = diffMatch ? diffMatch[1].trim() : "";

    if (!diff) {
        return "chore/empty-diff";
    }

    // -----------------------------
    // 1. Detect files touched
    // -----------------------------
    const fileRegex = /^diff --git a\/(.+?) b\/(.+)$/gm;
    const files: string[] = [];
    let m;

    while ((m = fileRegex.exec(diff)) !== null) {
        files.push(m[1]);
    }

    const primaryFile = files[0] || "general";

    let rawDir = path.dirname(primaryFile);

    //Assuming changes in root dir are less specific
    if (rawDir === "." || rawDir === "") {
        rawDir = "";
    }

    const scope =
        rawDir ||
        path.basename(primaryFile, path.extname(primaryFile)).toLowerCase() ||
        "core";
    // -----------------------------
    // 2. Detect commit type
    // -----------------------------
    let type: string = "chore";

    if (/fix|error|bug/i.test(diff)) {
        type = "fix";
    } else if (/add|new|create/i.test(diff)) {
        type = "feat";
    } else if (/remove|delete/i.test(diff)) {
        type = "chore";
    } else if (/refactor/i.test(diff)) {
        type = "refactor";
    } else if (/perf|optimi[sz]e/i.test(diff)) {
        type = "perf";
    } else if (/docs|readme/i.test(diff)) {
        type = "docs";
    } else if (/test|spec/i.test(diff)) {
        type = "test";
    } else if (/style|format/i.test(diff)) {
        type = "style";
    }

    // -----------------------------
    // 3. Create a short description
    // -----------------------------
    const added = diff.match(/^\+/gm)?.length || 0;
    const removed = diff.match(/^\-/gm)?.length || 0;

    const descriptionParts: string[] = [];

    if (added && removed) {
        descriptionParts.push("update logic");
    } else if (added) {
        descriptionParts.push("add changes");
    } else if (removed) {
        descriptionParts.push("remove code");
    } else {
        descriptionParts.push("modify files");
    }

    const description = descriptionParts.join(" ").toLowerCase();

    // -----------------------------
    // 4. Decide output type (branch/commit)
    // by analyzing the prompt instructions
    // -----------------------------
    const isBranch = /branch name/i.test(prompt);
    const isCommit = /commit message/i.test(prompt);

    if (isBranch) {
        // Branch name format: type/short-scope-desc
        const branchName = `${type}/${scope}-${description.replace(
            /\s+/g,
            "-"
        )}`.slice(0, 40);

        return branchName;
    }

    if (isCommit) {
        // Commit format: type(scope): description
        return `${type}(${scope}): ${description}`;
    }

    // Default generic fallback
    return `${type}(${scope}): ${description}`;
}
