import { readdir, readFile } from "node:fs/promises";
import { micromark } from "micromark";
import { describe, expect, it } from "vitest";
import { templateVariable, templateVariableHtml } from "../src/index";

describe("micromark-extension-template-variable", () => {
  describe("basic functionality", () => {
    it("should expose the public api", () => {
      expect(typeof templateVariable).toBe("function");
      expect(typeof templateVariableHtml).toBe("function");
    });

    it("should support double curly braces {{variable}}", () => {
      const result = micromark("Hello {{planet}}!", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p>Hello <var>planet</var>!</p>");
    });

    it("should support multiple variables in one line", () => {
      const result = micromark("{{greeting}} {{name}}!", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p><var>greeting</var> <var>name</var>!</p>");
    });

    it("should not support single curly braces by default", () => {
      const result = micromark("Hello {planet}!", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p>Hello {planet}!</p>");
    });
  });

  describe("empty variables", () => {
    it("should support empty double braces {{}}", () => {
      const result = micromark("Hello {{}}!", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p>Hello <var></var>!</p>");
    });
  });

  describe("escaping", () => {
    it("should support escaped closing brace \\}", () => {
      const result = micromark("Hello {{pla\\}net}}!", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p>Hello <var>pla}net</var>!</p>");
    });

    it("should support escaped opening brace \\{", () => {
      const result = micromark("Hello {{pla\\{net}}!", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p>Hello <var>pla{net</var>!</p>");
    });

    it("should support escaped backslash \\\\", () => {
      const result = micromark("Hello {{pla\\\\net}}!", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p>Hello <var>pla\\net</var>!</p>");
    });

    it("should support multiple escapes", () => {
      const result = micromark("{{\\{\\}\\\\}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p><var>{}\\</var></p>");
    });

    it("should treat invalid escape as literal", () => {
      const result = micromark("{{planet\\n}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p><var>planet\\n</var></p>");
    });

    it("should support character references", () => {
      const result = micromark("{{pla&#x7d;net}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p><var>pla}net</var></p>");
    });

    it("should support named character references", () => {
      const result = micromark("{{pla&rbrace;net}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p><var>pla}net</var></p>");
    });
  });

  describe("line endings", () => {
    it("should not support line endings in variables (LF)", () => {
      const result = micromark("{{hello\nworld}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p>{{hello\nworld}}</p>");
    });

    it("should not support line endings in variables (CRLF)", () => {
      const result = micromark("{{hello\r\nworld}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p>{{hello\r\nworld}}</p>");
    });

    it("should not support line endings in variables (CR)", () => {
      const result = micromark("{{hello\rworld}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p>{{hello\rworld}}</p>");
    });
  });

  describe("edge cases", () => {
    it("should handle EOF inside variable", () => {
      const result = micromark("{{incomplete", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p>{{incomplete</p>");
    });

    it("should handle unmatched opening braces", () => {
      const result = micromark("{{hello}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p>{{hello}</p>");
    });

    it("should allow single { in content (double mode)", () => {
      const result = micromark("{{a{b}c}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      // Single { is allowed per lezer grammar: '{' ![{]
      expect(result).toBe("<p><var>a{b}c</var></p>");
    });

    it("should allow single } in content (double mode)", () => {
      const result = micromark("{{a}b}c}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      // Single } is allowed per lezer grammar: '}' ![}]
      expect(result).toBe("<p><var>a}b}c</var></p>");
    });

    it("should not match variables with nested {{ sequences", () => {
      const result = micromark("{{a{{b}}c}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      // {{a{{ fails when it sees the second {{, so it backtracks
      // Then {{b}} matches successfully, leaving {{a and c}} as text
      expect(result).toBe("<p>{{a<var>b</var>c}}</p>");
    });

    it("should handle triple braces", () => {
      const result = micromark("{{{hello}}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      // {{{hello}}} -> first {{parsesasvar with {hello as content, then }
      expect(result).toBe("<p><var>{hello</var>}</p>");
    });

    it("should handle quadruple braces", () => {
      const result = micromark("{{{{hello}}}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      // {{{{hello}}}} -> first { is text, then {{parsesas var with {hello, remaining }}
      expect(result).toBe("<p>{<var>{hello</var>}}</p>");
    });
    it("should handle adjacent variables", () => {
      const result = micromark("{{a}}{{b}}{{c}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p><var>a</var><var>b</var><var>c</var></p>");
    });

    it("should handle spaces in variables", () => {
      const result = micromark("{{ hello world }}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p><var> hello world </var></p>");
    });

    it("should handle special characters in variables", () => {
      const result = micromark("{{user.name}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p><var>user.name</var></p>");
    });

    it("should handle numbers in variables", () => {
      const result = micromark("{{var123}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p><var>var123</var></p>");
    });

    it("should handle underscores in variables", () => {
      const result = micromark("{{user_name}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p><var>user_name</var></p>");
    });

    it("should handle hyphens in variables", () => {
      const result = micromark("{{user-name}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p><var>user-name</var></p>");
    });
  });

  describe("interaction with markdown", () => {
    it("should work inside emphasis", () => {
      const result = micromark("*{{var}}*", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p><em><var>var</var></em></p>");
    });

    it("should work inside strong", () => {
      const result = micromark("**{{var}}**", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p><strong><var>var</var></strong></p>");
    });

    it("should work with inline code", () => {
      const result = micromark("`{{var}}`", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p><code>{{var}}</code></p>");
    });

    it("should work in headings", () => {
      const result = micromark("# {{title}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<h1><var>title</var></h1>");
    });

    it("should work in links", () => {
      const result = micromark("[{{text}}]({{url}})", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      // URL will be percent-encoded
      expect(result).toBe(
        '<p><a href="%7B%7Burl%7D%7D"><var>text</var></a></p>',
      );
    });

    it("should work in lists", () => {
      const result = micromark("- {{item1}}\n- {{item2}}", {
        extensions: [templateVariable()],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe(
        "<ul>\n<li><var>item1</var></li>\n<li><var>item2</var></li>\n</ul>",
      );
    });
  });

  describe("disable construct", () => {
    it("should not parse variables when disabled", () => {
      const result = micromark("{{var}}", {
        extensions: [
          templateVariable(),
          { disable: { null: ["templateVariable"] } },
        ],
        htmlExtensions: [templateVariableHtml()],
      });
      expect(result).toBe("<p>{{var}}</p>");
    });
  });
});

describe("fixtures", async () => {
  const fixturesDir = new URL("fixtures/", import.meta.url);

  try {
    const files = await readdir(fixturesDir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    for (const file of mdFiles) {
      const name = file.slice(0, -3);

      it(name, async () => {
        const mdContent = await readFile(new URL(file, fixturesDir), "utf-8");
        const htmlPath = new URL(`${name}.html`, fixturesDir);

        let expected: string;
        try {
          expected = await readFile(htmlPath, "utf-8");
        } catch {
          // If no HTML file exists, skip comparison
          return;
        }

        let actual = micromark(mdContent, {
          extensions: [templateVariable()],
          htmlExtensions: [templateVariableHtml()],
        });

        // Normalize line endings
        if (actual && !/\n$/.test(actual)) {
          actual += "\n";
        }

        expect(actual).toBe(expected);
      });
    }
  } catch {
    // No fixtures directory, skip
  }
});
