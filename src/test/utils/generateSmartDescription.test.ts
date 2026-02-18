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

            const result = generateSmartDescription(diff);

            expect(result).toContain("implement addToCart");
        });

        it("detects React component creation", () => {
            const diff = `
+ export default function ProductPage() {
+   return <div>Product</div>;
+ }
`;

            const result = generateSmartDescription(diff);

            expect(result).toContain("create ProductPage");
        });

        it("detects authentication addition", () => {
            const diff = `
+ router.use(authenticateUser);
+ const token = jwt.sign(payload, SECRET);
`;

            const result = generateSmartDescription(diff);

            expect(result).toContain("authentication");
        });

        it("detects async/await refactor", () => {
            const diff = `
- fetchData().then(res => handle(res));
+ const res = await fetchData();
+ handle(res);
`;

            const result = generateSmartDescription(diff);

            expect(result).toContain("async/await");
        });

        it("detects database schema changes", () => {
            const diff = `
+ const UserSchema = new mongoose.Schema({
+   name: String
+ });
`;

            const result = generateSmartDescription(diff);

            expect(result).toContain("database");
        });

        it("detects dependency updates", () => {
            const diff = `
diff --git a/package.json b/package.json
+ "zod": "^3.22.0"
- "zod": "^3.21.0"
`;

            const result = generateSmartDescription(diff);

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

            const result = generateSmartDescription(diff);

            expect(result).toContain("unit tests");
        });

        it("detects logging removal", () => {
            const diff = `
- console.log("debug info");
`;

            const result = generateSmartDescription(diff);

            expect(result).toContain("remove debug logging");
        });

        it("falls back when no semantic signal found", () => {
            const diff = `
+ const a = 1;
- const b = 2;
`;

            const result = generateSmartDescription(diff);

            expect(result).toBe("update logic");
        });

        it("handles empty diff safely", () => {
            const result = generateSmartDescription("");

            expect(result).toBe("no changes detected");
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
