import { describe, it, expect } from "vitest";
import { formatForCli } from "../../src/cli/formatter.js";
import type { HumanizedError } from "../../src/types/index.js";

const sampleResult: HumanizedError = {
  title: 'Accessed property "id" on undefined',
  explanation:
    'You tried to read the property "id" from a value that is undefined.',
  possibleCauses: [
    "A variable was declared but never initialised",
    "An async operation hadn't completed",
  ],
  suggestions: [
    'Add a null-check: `if (obj != null) { obj.id }`',
    "Use optional chaining: `obj?.id`",
  ],
  confidence: 0.97,
  errorType: "TypeError",
  location: {
    functionName: "handleRequest",
    fileName: "/app/src/handler.ts",
    lineNumber: 42,
    columnNumber: 8,
    isRelevant: true,
  },
};

describe("formatForCli", () => {
  it("includes the title in the output", () => {
    const output = formatForCli(sampleResult, false);
    expect(output).toContain('Accessed property "id" on undefined');
  });

  it("includes the explanation section", () => {
    const output = formatForCli(sampleResult, false);
    expect(output).toContain("Explanation");
    expect(output).toContain("undefined");
  });

  it("includes possible causes", () => {
    const output = formatForCli(sampleResult, false);
    expect(output).toContain("Possible Causes");
    expect(output).toContain("async operation");
  });

  it("includes suggestions numbered", () => {
    const output = formatForCli(sampleResult, false);
    expect(output).toContain("Suggestions");
    expect(output).toContain("1.");
    expect(output).toContain("2.");
  });

  it("includes location when present", () => {
    const output = formatForCli(sampleResult, false);
    expect(output).toContain("Location");
    expect(output).toContain("/app/src/handler.ts:42:8");
    expect(output).toContain("handleRequest");
  });

  it("includes confidence percentage", () => {
    const output = formatForCli(sampleResult, false);
    expect(output).toContain("97%");
  });

  it("omits location section when location is undefined", () => {
    const noLocation = { ...sampleResult, location: undefined };
    const output = formatForCli(noLocation, false);
    expect(output).not.toContain("📍 Location");
  });

  it("includes stack trace section when stack is set", () => {
    const withStack: HumanizedError = {
      ...sampleResult,
      stack: "TypeError: ...\n    at handleRequest (/app/src/handler.ts:42:8)",
    };
    const output = formatForCli(withStack, false);
    expect(output).toContain("Stack Trace");
  });

  it("does not include ANSI codes when useColor is false", () => {
    const output = formatForCli(sampleResult, false);
    expect(output).not.toContain("\x1b[");
  });

  it("includes ANSI codes when useColor is true", () => {
    const output = formatForCli(sampleResult, true);
    expect(output).toContain("\x1b[");
  });

  it("handles result with no causes or suggestions gracefully", () => {
    const minimal: HumanizedError = {
      title: "An error",
      explanation: "Something failed.",
      possibleCauses: [],
      suggestions: [],
      confidence: 0.1,
    };
    const output = formatForCli(minimal, false);
    expect(output).toContain("An error");
    expect(output).not.toContain("Possible Causes");
    expect(output).not.toContain("Suggestions");
  });

  it("shows low confidence in red (color=true)", () => {
    const lowConf: HumanizedError = { ...sampleResult, confidence: 0.2 };
    const output = formatForCli(lowConf, true);
    expect(output).toContain("20%");
  });
});
