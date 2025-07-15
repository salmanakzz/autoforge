import { getGitDiff } from "../../GitOps/utils";
import { exec } from "child_process";

jest.mock("child_process", () => ({
    exec: jest.fn(),
}));

describe("getGitDiff", () => {
    it("should resolve with stdout when git diff runs successfully", async () => {
        (exec as unknown as jest.Mock).mockImplementation((_cmd, cb) =>
            cb(null, "diff output", "")
        );
        const result = await getGitDiff();
        expect(result).toBe("diff output");
    });

    it("should reject with stderr when git diff fails", async () => {
        (exec as unknown as jest.Mock).mockImplementation((_cmd, cb) =>
            cb(new Error(), "", "some error")
        );
        await expect(getGitDiff()).rejects.toBe("some error");
    });
});
