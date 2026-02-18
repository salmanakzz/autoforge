import { sanitizeAIOutput } from "../../utils/sanitizeAIOutput";

describe("sanitizeAIOutput", () => {
    it("removes backticks", () => {
        const input = "```hello world```";

        const result = sanitizeAIOutput(input);

        expect(result).toBe("hello world");
    });

    it("removes single quotes", () => {
        const input = "'hello world'";

        const result = sanitizeAIOutput(input);

        expect(result).toBe("hello world");
    });

    it("removes double quotes", () => {
        const input = '"hello world"';

        const result = sanitizeAIOutput(input);

        expect(result).toBe("hello world");
    });

    it("removes mixed quotes and backticks", () => {
        const input = '`"hello world"`';

        const result = sanitizeAIOutput(input);

        expect(result).toBe("hello world");
    });

    it("trims whitespace", () => {
        const input = "   hello world   ";

        const result = sanitizeAIOutput(input);

        expect(result).toBe("hello world");
    });

    it("handles multiline AI output", () => {
        const input = `
      \`\`\`
      "generated commit message"
      \`\`\`
    `;

        const result = sanitizeAIOutput(input);

        expect(result).toBe("generated commit message");
    });

    it("returns empty string if only removable characters exist", () => {
        const input = "```''\"\"```";

        const result = sanitizeAIOutput(input);

        expect(result).toBe("");
    });

    it("does not modify normal text", () => {
        const input = "update login logic";

        const result = sanitizeAIOutput(input);

        expect(result).toBe("update login logic");
    });
});
