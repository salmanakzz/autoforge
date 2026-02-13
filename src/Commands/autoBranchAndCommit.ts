import { autoBranch } from "./autoBranch";
import { autoCommit } from "./autoCommit";

export async function autoBranchAndCommit(section = "cp") {
    try {
        // First create branch, then commit
        await autoBranch();
        // Small delay to ensure branch is created and Git state is updated
        await new Promise((resolve) => setTimeout(resolve, 500));
        await autoCommit(section);
    } catch (error) {
        console.error(error);
        throw error;
    }
}
