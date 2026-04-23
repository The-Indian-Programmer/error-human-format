import { describe, it, expect } from "vitest";
import { normalizeError, stripErrorPrefix } from "../../src/utils/normalizer.js";

describe("normalizeError", () => {
  it("handles a native Error instance", () => {
    const err = new TypeError("Cannot read properties of undefined (reading 'foo')");
    const result = normalizeError(err);

    expect(result.message).toBe("Cannot read properties of undefined (reading 'foo')");
    expect(result.errorType).toBe("TypeError");
    expect(result.stack).toBeDefined();
  });

  it("handles a plain string message", () => {
    const result = normalizeError("Something went wrong");
    expect(result.message).toBe("Something went wrong");
    expect(result.errorType).toBeUndefined();
  });

  it("detects error type from prefixed string", () => {
    const result = normalizeError("ReferenceError: myVar is not defined");
    expect(result.errorType).toBe("ReferenceError");
  });

  it("treats multi-line string with 'at' frames as a stack trace", () => {
    const stack = `TypeError: x is not a function
    at Object.<anonymous> (/app/src/index.js:1:1)`;
    const result = normalizeError(stack);
    expect(result.stack).toBeDefined();
    expect(result.errorType).toBe("TypeError");
  });

  it("handles a plain object with message and stack", () => {
    const result = normalizeError({
      message: "Custom error",
      stack: "Error: Custom error\n    at fn (/app/src/x.ts:1:1)",
    });
    expect(result.message).toBe("Custom error");
    expect(result.stack).toContain("at fn");
  });

  it("handles empty string input", () => {
    const result = normalizeError("");
    expect(result.message).toBe("");
  });

  it("handles subclass errors (e.g., RangeError)", () => {
    const err = new RangeError("Maximum call stack size exceeded");
    const result = normalizeError(err);
    expect(result.errorType).toBe("RangeError");
  });
});

describe("stripErrorPrefix", () => {
  it("strips known error prefix", () => {
    expect(stripErrorPrefix("TypeError: foo is not a function")).toBe("foo is not a function");
  });

  it("strips ReferenceError prefix", () => {
    expect(stripErrorPrefix("ReferenceError: myVar is not defined")).toBe("myVar is not defined");
  });

  it("returns original string if no prefix", () => {
    expect(stripErrorPrefix("Something went wrong")).toBe("Something went wrong");
  });

  it("handles empty string", () => {
    expect(stripErrorPrefix("")).toBe("");
  });
});
