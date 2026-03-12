import {
    generateSmartDescription,
    parseDiffContext,
    analyzeSignals,
} from "../../utils/generateSmartDescription";

describe("Git Diff Summarization Engine", () => {
    describe("generateSmartDescription()", () => {
        it("detects new function implementation", () => {
            const diff = `
+ export function addToCart(item) {
+   return cart.push(item);
+ }
`;

            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);

            const result = generateSmartDescription(ctx, signals);

            expect(result).toContain("implement addToCart");
        });

        it("detects React component creation", () => {
            const diff = `
+ export default function ProductPage() {
+   return <div>Product</div>;
+ }
`;

            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);

            const result = generateSmartDescription(ctx, signals);
            expect(result).toContain("create ProductPage");
        });

        it("detects authentication addition", () => {
            const diff = `
+ router.use(authenticateUser);
+ const token = jwt.sign(payload, SECRET);
`;

            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);

            const result = generateSmartDescription(ctx, signals);
            expect(result).toContain("authentication");
        });

        it("detects async/await refactor", () => {
            const diff = `
- fetchData().then(res => handle(res));
+ const res = await fetchData();
+ handle(res);
`;

            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);

            const result = generateSmartDescription(ctx, signals);
            expect(result).toContain("async/await");
        });

        it("detects database schema changes", () => {
            const diff = `
+ const UserSchema = new mongoose.Schema({
+   name: String
+ });
`;

            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);

            const result = generateSmartDescription(ctx, signals);
            expect(result).toContain("database");
        });

        it("detects dependency updates", () => {
            const diff = `
diff --git a/package.json b/package.json
+ "zod": "^3.22.0"
- "zod": "^3.21.0"
`;

            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);

            const result = generateSmartDescription(ctx, signals);
            expect(result).toContain("dependencies");
        });

        it("detects test additions", () => {
            const diff = `
diff --git a/user.service.test.ts b/user.service.test.ts
+ describe("UserService", () => {
+   it("should create user", () => {
+     expect(true).toBe(true);
+   });
+ });
`;

            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);

            const result = generateSmartDescription(ctx, signals);
            expect(result).toContain("unit tests");
        });

        it("detects logging removal", () => {
            const diff = `
- console.log("debug info");
`;

            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);

            const result = generateSmartDescription(ctx, signals);
            expect(result).toContain("remove debug logging");
        });

        it("detect variable changes", () => {
            const diff = `
+ const a = 1;
- const b = 2;
`;

            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);

            const result = generateSmartDescription(ctx, signals);
            expect(result).toBe("refactor a");
        });

        it("handles empty diff safely", () => {
            const result = generateSmartDescription(
                { addedLines: [], removedLines: [] } as any,
                [],
            );

            expect(result).toBe("modify files");
        });
    });

    describe("signal pipeline", () => {
        it("returns ranked signals", () => {
            const diff = `
+ export function calculateTotal() {}
+ router.post("/orders", handler);
`;

            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);

            expect(signals.length).toBeGreaterThan(0);
            expect(signals[0]).toHaveProperty("kind");
            expect(signals[0]).toHaveProperty("score");
        });
    });
});
