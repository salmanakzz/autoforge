import { generateSmartBranchName } from "../../utils/generateSmartBranchName ";
import { Signal } from "../../utils/types";
describe("generateSmartBranchName", () => {
    const baseScope = "cart";
    const baseType = "feat";

    test("creates branch name from single function signal", () => {
        const signals: Signal[] = [
            {
                kind: "function",
                subjects: ["addToCart"],
                verb: "implement",
                score: 8,
            },
        ];

        const result = generateSmartBranchName(signals, baseScope, baseType);

        expect(result).toBe("feat/cart-add-cart");
    });

    test("splits camelCase and PascalCase identifiers", () => {
        const signals: Signal[] = [
            {
                kind: "component",
                subjects: ["ProductPage"],
                verb: "create",
                score: 9,
            },
        ];

        const result = generateSmartBranchName(signals, "product", "feat");

        expect(result).toBe("feat/product-add-page");
    });

    test("handles multiple subjects and merges words", () => {
        const signals: Signal[] = [
            {
                kind: "function",
                subjects: ["addToCart", "calculateTotal"],
                verb: "implement",
                score: 8,
            },
        ];

        const result = generateSmartBranchName(signals, "cart", "feat");

        expect(result).toBe("feat/cart-add-cart-calculate-total");
    });

    test("deduplicates repeated words across signals", () => {
        const signals: Signal[] = [
            {
                kind: "auth",
                subjects: ["authentication"],
                verb: "add",
                score: 9,
            },
            {
                kind: "validation",
                subjects: ["authentication validation"],
                verb: "add",
                score: 8,
            },
        ];

        const result = generateSmartBranchName(signals, "auth", "feat");

        // "authentication" should not repeat
        expect(result).toBe("feat/auth-add-authentication-validation");
    });

    test("maps verbs correctly for branch naming", () => {
        const signals: Signal[] = [
            {
                kind: "async",
                subjects: ["promise chains to async/await"],
                verb: "refactor",
                score: 8,
            },
        ];

        const result = generateSmartBranchName(signals, "booking", "refactor");

        expect(result).toBe("refactor/booking-refactor-async-await");
    });

    test("limits subjects to avoid overly long branch names", () => {
        const signals: Signal[] = [
            {
                kind: "function",
                subjects: [
                    "addToCart",
                    "calculateTotal",
                    "removeFromCart",
                    "updateCartState",
                ],
                verb: "implement",
                score: 8,
            },
        ];

        const result = generateSmartBranchName(signals, "cart", "feat");

        // Only first two subjects used
        expect(result).toContain("add-cart-calculate-total");
        expect(result).not.toContain("remove-from-cart");
    });

    test("trims slug when exceeding max length", () => {
        const signals: Signal[] = [
            {
                kind: "function",
                subjects: [
                    "veryLongFunctionNameOne",
                    "anotherExtremelyLongFunctionNameTwo",
                ],
                verb: "implement",
                score: 8,
            },
        ];

        const result = generateSmartBranchName(signals, "feature", "feat");

        // Should not exceed ~50 chars total
        expect(result.length).toBeLessThanOrEqual(55);
    });

    test("returns fallback when no signals exist", () => {
        const result = generateSmartBranchName([], "core", "chore");

        expect(result).toBe("chore/core-update");
    });
});
