import * as path from "path";
import { generateSmartDescription } from "../utils/generateSmartDescription";

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
    // ------------------------------------
    // 0. Extract diff from prompt
    // ------------------------------------
    const diffMatch = prompt.match(/Diff:\s*([\s\S]*)$/);
    const diff = diffMatch ? diffMatch[1].trim() : "";

    if (!diff || diff.trim().length < 5) {
        return "chore/empty-diff";
    }

    // ------------------------------------
    // 1. Detect files touched
    // ------------------------------------
    const files: string[] = [];

    // Method A — Standard git diff header
    const fullDiffRegex = /^diff --git a\/(.+?) b\/(.+)$/gm;
    let match;

    while ((match = fullDiffRegex.exec(diff)) !== null) {
        files.push(match[1]);
    }

    // Method B — fallback for "+++ b/file"
    if (files.length === 0) {
        const plusRegex = /^\+\+\+ b\/(.+)$/gm;
        let m2;
        while ((m2 = plusRegex.exec(diff)) !== null) {
            files.push(m2[1]);
        }
    }

    // Final fallback
    const primaryFile = files[0] || "general";

    // ------------------------------------
    // 2. Extract scope from file/directory
    // ------------------------------------
    let rawDir = path.dirname(primaryFile);

    // Treat root as "root" (your requirement)
    if (rawDir === "." || rawDir === "") {
        rawDir = "root";
    }

    const scope =
        rawDir ||
        path.basename(primaryFile, path.extname(primaryFile)).toLowerCase() ||
        "core";

    // ------------------------------------
    // 3. Detect commit type
    // ------------------------------------
    let type: string = "chore";
    const lowercase = diff.toLowerCase();

    if (/(fix|error|bug|fail|patch)/.test(lowercase)) {
        type = "fix";
    } else if (/(add|new|create|implement)/.test(lowercase)) {
        type = "feat";
    } else if (/(remove|delete|cleanup)/.test(lowercase)) {
        type = "chore";
    } else if (/refactor/.test(lowercase)) {
        type = "refactor";
    } else if (/(perf|optimi[sz]e)/.test(lowercase)) {
        type = "perf";
    } else if (/(docs|readme|comment)/.test(lowercase)) {
        type = "docs";
    } else if (/(test|spec)/.test(lowercase)) {
        type = "test";
    } else if (/(style|format|lint|prettier)/.test(lowercase)) {
        type = "style";
    }

    // ------------------------------------
    // 4. Generate smart description
    // ------------------------------------
    const description = generateSmartDescription(diff);

    // ------------------------------------
    // 5. Detect output mode (branch / commit)
    // ------------------------------------
    const isBranch = /branch name/i.test(prompt);
    const isCommit = /commit message/i.test(prompt);

    // ------------------------------------
    // 6. Generate Branch Name
    // ------------------------------------
    if (isBranch) {
        const branchName = `${type}/${scope}-${description
            .replace(/\s+/g, "-")
            .toLowerCase()}`.slice(0, 40); // enforce 40 char limit

        return branchName;
    }

    // ------------------------------------
    // 7. Generate Commit Message
    // ------------------------------------
    if (isCommit) {
        return `${type}(${scope}): ${description}`;
    }

    // ------------------------------------
    // 8. Fallback
    // ------------------------------------
    return `${type}(${scope}): ${description}`;
}
