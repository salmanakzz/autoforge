import { getGitDiff } from "./utils";
import { generateCommitMessageFromDiff } from "../AI/aiProvider";

export async function generateCommit(): Promise<string> {
    const { diff } = await getGitDiff();
    const suggestedCommit = await generateCommitMessageFromDiff(diff);
    return suggestedCommit;
}
