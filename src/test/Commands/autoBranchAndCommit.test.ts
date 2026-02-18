import { autoBranchAndCommit } from "../../Commands/autoBranchAndCommit";
import { autoBranch } from "../../Commands/autoBranch";
import { autoCommit } from "../../Commands/autoCommit";

jest.mock("../../Commands/autoBranch");
jest.mock("../../Commands/autoCommit");

describe("autoBranchAndCommit", () => {
    const mockedAutoBranch = autoBranch as jest.Mock;
    const mockedAutoCommit = autoCommit as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // ✅ happy path
    it("should call autoBranch then autoCommit", async () => {
        mockedAutoBranch.mockResolvedValue(undefined);
        mockedAutoCommit.mockResolvedValue(undefined);

        const promise = autoBranchAndCommit("cp");

        await jest.runAllTimersAsync();

        await promise;

        expect(mockedAutoBranch).toHaveBeenCalled();
        expect(mockedAutoCommit).toHaveBeenCalledWith("cp");
    });

    // ✅ default parameter
    it("should use default section 'cp'", async () => {
        mockedAutoBranch.mockResolvedValue(undefined);
        mockedAutoCommit.mockResolvedValue(undefined);

        const promise = autoBranchAndCommit();

        await jest.runAllTimersAsync();
        await promise;

        expect(mockedAutoCommit).toHaveBeenCalledWith("cp");
    });

    // ✅ autoBranch failure
    it("should throw if autoBranch fails", async () => {
        mockedAutoBranch.mockRejectedValue(new Error("branch failed"));

        await expect(autoBranchAndCommit()).rejects.toThrow("branch failed");

        expect(mockedAutoCommit).not.toHaveBeenCalled();
    });

    // ✅ autoCommit failure
    it("should throw if autoCommit fails", async () => {
        mockedAutoBranch.mockResolvedValue(undefined);
        mockedAutoCommit.mockRejectedValue(new Error("commit failed"));

        const execution = autoBranchAndCommit();

        // attach rejection handler BEFORE timers run
        const expectation = expect(execution).rejects.toThrow("commit failed");

        await jest.runAllTimersAsync();

        await expectation;
    });
});
