import {
    generateSmartDescription,
    parseDiffContext,
    analyzeSignals,
} from "../../utils/generateSmartDescription";

describe("Git Diff Summarization Engine - Real World Cases", () => {
    describe("multi-file changes", () => {
        it("config key rename across multiple files collapses into single message", () => {
            const diff = `
diff --git a/src/AI/aiProvider.ts b/src/AI/aiProvider.ts
index 6134b31..1c7d0c9 100644
--- a/src/AI/aiProvider.ts
+++ b/src/AI/aiProvider.ts
@@ -15,7 +15,7 @@ export async function callAIProvider({
-                .getConfiguration("myExtension")
+                .getConfiguration("autoforge")
                 .get("provider");
diff --git a/src/Services/groq.ts b/src/Services/groq.ts
index f0c799c..55f8f07 100644
--- a/src/Services/groq.ts
+++ b/src/Services/groq.ts
@@ -10,7 +10,7 @@ export async function callGroq({
-                .getConfiguration("myExtension")
+                .getConfiguration("autoforge")
                 .get("apiKey");
`;
            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);
            const result = generateSmartDescription(ctx, signals);

            // Should not duplicate "autoforge autoforge"
            // Should describe the transition, not just the new value
            expect(result).toContain("from myExtension to autoforge");
            expect(result).not.toMatch(/autoforge.*autoforge/);
        });

        it("picks primary change when files have different intents", () => {
            const diff = `
diff --git a/src/cart/cartService.ts b/src/cart/cartService.ts
--- a/src/cart/cartService.ts
+++ b/src/cart/cartService.ts
+ export function addToCart(item) {
+   return cart.push(item);
+ }
+ export function removeFromCart(id) {
+   return cart.filter(i => i.id !== id);
+ }
diff --git a/src/cart/cartService.test.ts b/src/cart/cartService.test.ts
--- a/src/cart/cartService.test.ts
+++ b/src/cart/cartService.test.ts
+ describe("cartService", () => {
+   it("should add item", () => {
+     expect(true).toBe(true);
+   });
+ });
diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
- "jest": "^29.0.0"
+ "jest": "^29.5.0"
`;
            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);
            const result = generateSmartDescription(ctx, signals);

            // Primary change is functions, not tests or deps
            expect(result).toContain("addToCart");
            expect(result).toContain("removeFromCart");
            // Low-score signals should be dropped
            expect(result).not.toContain("dependencies");
        });

        it("does not list more than 3 subjects per clause", () => {
            const diff = `
diff --git a/src/utils/helpers.ts b/src/utils/helpers.ts
--- a/src/utils/helpers.ts
+++ b/src/utils/helpers.ts
+ export function formatDate(d) { return d.toISOString(); }
+ export function formatCurrency(n) { return n.toFixed(2); }
+ export function formatPhone(p) { return p.replace(/\D/g, ""); }
+ export function formatEmail(e) { return e.toLowerCase(); }
+ export function formatName(n) { return n.trim(); }
`;
            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);
            const result = generateSmartDescription(ctx, signals);

            // Should cap at 3 subjects — not list all 5
            const subjectCount = (result.match(/format[A-Z]/g) ?? []).length;
            expect(subjectCount).toBeLessThanOrEqual(3);
        });
    });

    describe("refactor patterns", () => {
        it("detects variable rename (Map type swap)", () => {
            const diff = `
diff --git a/src/utils/generateSmartDescription.ts b/src/utils/generateSmartDescription.ts
--- a/src/utils/generateSmartDescription.ts
+++ b/src/utils/generateSmartDescription.ts
-     const bestByKind = new Map<SignalKind, Signal>();
+     const bestByKindVerb = new Map<string, Signal>();
`;
            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);
            const result = generateSmartDescription(ctx, signals);

            expect(result).toContain("bestByKindVerb");
            expect(result).not.toBe("update logic");
            expect(result).not.toBe("refactor existing logic");
        });

        it("detects promise chain to async/await with function context", () => {
            const diff = `
diff --git a/src/services/userService.ts b/src/services/userService.ts
--- a/src/services/userService.ts
+++ b/src/services/userService.ts
- export function getUser(id) {
-   return db.find(id).then(user => formatUser(user));
- }
+ export async function getUser(id) {
+   const user = await db.find(id);
+   return formatUser(user);
+ }
`;
            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);
            const result = generateSmartDescription(ctx, signals);

            expect(result).toContain("async/await");
        });

        it("detects class refactor (same name, changed internals)", () => {
            const diff = `
diff --git a/src/services/BookingService.ts b/src/services/BookingService.ts
--- a/src/services/BookingService.ts
+++ b/src/services/BookingService.ts
- class BookingService {
-   book(id) { return fetch("/book/" + id); }
- }
+ class BookingService {
+   async book(id) {
+     try {
+       return await fetch("/book/" + id);
+     } catch(e) {
+       throw new BookingError(e);
+     }
+   }
+ }
`;
            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);
            const result = generateSmartDescription(ctx, signals);

            // Class refactored + error handling added
            expect(result).toMatch(/refactor|error handling/);
        });
    });

    describe("feature additions", () => {
        it("detects new React component with hooks", () => {
            const diff = `
diff --git a/src/ui/CartPage.tsx b/src/ui/CartPage.tsx
--- /dev/null
+++ b/src/ui/CartPage.tsx
+ import { useState, useEffect } from "react";
+
+ export default function CartPage() {
+   const [items, setItems] = useState([]);
+
+   useEffect(() => {
+     fetchCart().then(setItems);
+   }, []);
+
+   return <div>{items.map(i => <CartItem key={i.id} item={i} />)}</div>;
+ }
+
+ export function useCartItems() {
+   return useState([]);
+ }
`;
            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);
            const result = generateSmartDescription(ctx, signals);

            expect(result).toContain("CartPage");
            // useCartItems is a hook — should be detected separately or merged
            expect(result).toMatch(/CartPage|useCartItems/);
        });

        it("detects auth middleware addition", () => {
            const diff = `
diff --git a/src/routes/user.ts b/src/routes/user.ts
--- a/src/routes/user.ts
+++ b/src/routes/user.ts
+ router.use(authenticateUser);
+ router.use(authorize("admin"));
+
  router.get("/users", getUsers);
  router.post("/users", createUser);
`;
            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);
            const result = generateSmartDescription(ctx, signals);

            expect(result).toContain("authentication");
        });

        it("detects zod validation addition", () => {
            const diff = `
diff --git a/src/routes/order.ts b/src/routes/order.ts
--- a/src/routes/order.ts
+++ b/src/routes/order.ts
+ const orderSchema = z.object({
+   productId: z.string().uuid(),
+   quantity: z.number().min(1),
+   userId: z.string(),
+ });
+
  router.post("/orders", (req, res) => {
+   const parsed = orderSchema.parse(req.body);
`;
            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);
            const result = generateSmartDescription(ctx, signals);

            expect(result).toContain("input validation");
        });
    });

    describe("cleanup and removal", () => {
        it("detects console.log removal across multiple functions", () => {
            const diff = `
diff --git a/src/services/paymentService.ts b/src/services/paymentService.ts
--- a/src/services/paymentService.ts
+++ b/src/services/paymentService.ts
  export function processPayment(amount) {
-   console.log("processing payment", amount);
    return stripe.charge(amount);
  }

  export function refundPayment(id) {
-   console.log("refunding", id);
    return stripe.refund(id);
  }
`;
            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);
            const result = generateSmartDescription(ctx, signals);

            expect(result).toContain("debug logging");
        });

        it("does not produce generic message for pure removal", () => {
            const diff = `
diff --git a/src/utils/legacy.ts b/src/utils/legacy.ts
--- a/src/utils/legacy.ts
+++ b/src/utils/legacy.ts
- export function legacyFormat(data) {
-   return JSON.stringify(data);
- }
`;
            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);
            const result = generateSmartDescription(ctx, signals);

            expect(result).not.toBe("modify files");
            expect(result).not.toBe("update logic");
        });
    });

    describe("fallback quality", () => {
        it("uses filename when no signals match", () => {
            const diff = `
diff --git a/src/utils/cryptoHelper.ts b/src/utils/cryptoHelper.ts
--- a/src/utils/cryptoHelper.ts
+++ b/src/utils/cryptoHelper.ts
+ const x = 1;
+ const y = 2;
`;
            const ctx = parseDiffContext(diff);
            const signals = analyzeSignals(ctx);
            const result = generateSmartDescription(ctx, signals);

            // Should use filename, not generic "add new functionality"
            expect(result).toMatch(/cryptoHelper|update|add/);
            expect(result).not.toBe("add new functionality");
        });

        it("uses parent folder for index files", () => {
            const diff = `
diff --git a/src/cart/index.ts b/src/cart/index.ts
--- a/src/cart/index.ts
+++ b/src/cart/index.ts
+ export * from "./cartService";
`;
            const ctx = parseDiffContext(diff);
            // Force fallback by passing empty signals
            const result = generateSmartDescription(ctx, []);

            // Should use "cart" not "index"
            expect(result).toContain("cart");
            expect(result).not.toContain("index");
        });
    });
});
