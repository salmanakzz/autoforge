import { getGitDiff } from "./utils";
import { generateCommitMessageFromDiff } from "../AI/aiProvider";

export async function generateCommit(): Promise<{
    msg: string;
    cwd: string;
}> {
    const { diff, cwd } = await getGitDiff();
    const suggestedCommit = await generateCommitMessageFromDiff(diff);
    return { msg: suggestedCommit, cwd };
}
