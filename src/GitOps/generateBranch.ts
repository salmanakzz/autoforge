import { getGitDiff } from "./utils";
import { generateBranchNameFromDiff } from "../AI/aiProvider";

export async function generateBranch(): Promise<{
    name: string;
    cwd: string;
}> {
    const { diff, cwd } = await getGitDiff();
    const suggestedBranch = await generateBranchNameFromDiff(diff);
    return { name: suggestedBranch, cwd };
}
