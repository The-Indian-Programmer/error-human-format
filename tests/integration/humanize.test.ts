import { describe, it, expect, vi } from "vitest";
import { humanize, registerPattern } from "../../src/core/humanizer.js";
import type { HumanizedError, AiFallbackHandler } from "../../src/types/index.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTypeError(message: string): TypeError {
  return new TypeError(message);
}

function makeRefError(message: string): ReferenceError {
  return new ReferenceError(message);
}

// ── Core API ─────────────────────────────────────────────────────────────────

describe("humanize() — core API", () => {
  it("returns a valid HumanizedError shape", async () => {
    const result = await humanize(
      new TypeError("Cannot read properties of undefined (reading 'name')")
    );

    expect(result).toMatchObject<Partial<HumanizedError>>({
      title: expect.any(String),
      explanation: expect.any(String),
      possibleCauses: expect.any(Array),
      suggestions: expect.any(Array),
      confidence: expect.any(Number),
    });

    expect(result.possibleCauses.length).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("accepts a plain Error object", async () => {
    const result = await humanize(new Error("Something exploded"));
    expect(result.title).toBeDefined();
    expect(result.confidence).toBeLessThan(0.5); // no pattern match
  });

  it("accepts a string error message", async () => {
    const result = await humanize("myVar is not defined");
    expect(result.errorType ?? result.title).toBeDefined();
  });

  it("accepts a full stack trace string", async () => {
    const stack = `ReferenceError: someVar is not defined
    at Object.<anonymous> (/app/src/index.js:5:10)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)`;

    const result = await humanize(stack);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.location).toBeDefined();
    expect(result.location?.fileName).toBe("/app/src/index.js");
    expect(result.location?.lineNumber).toBe(5);
  });

  it("accepts a plain object with message + stack", async () => {
    const result = await humanize({
      message: "Cannot find module 'lodash'",
      stack: "Error: Cannot find module 'lodash'\n    at fn (/app/src/x.ts:1:1)",
    });
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});

// ── Options ───────────────────────────────────────────────────────────────────

describe("humanize() — options", () => {
  it("includes stack trace when includeStack: true", async () => {
    const err = makeTypeError("Cannot read properties of undefined (reading 'x')");
    const result = await humanize(err, { includeStack: true });
    expect(result.stack).toBeDefined();
    expect(result.stack).toContain("TypeError");
  });

  it("does not include stack trace by default", async () => {
    const err = makeTypeError("Cannot read properties of null (reading 'y')");
    const result = await humanize(err);
    expect(result.stack).toBeUndefined();
  });

  it("sets errorType on the result", async () => {
    const err = makeRefError("undeclaredVar is not defined");
    const result = await humanize(err);
    expect(result.errorType).toBe("ReferenceError");
  });

  it("calls aiFallback when no pattern matches", async () => {
    const mockFallback: AiFallbackHandler = vi.fn().mockResolvedValue({
      title: "AI Response",
      explanation: "AI explanation",
      possibleCauses: ["AI cause"],
      suggestions: ["AI suggestion"],
      confidence: 0.6,
    });

    const result = await humanize("totally_unrecognisable_xyz_error_12345", {
      aiFallback: mockFallback,
    });

    expect(mockFallback).toHaveBeenCalledOnce();
    expect(result.title).toBe("AI Response");
  });

  it("falls back gracefully when aiFallback throws", async () => {
    const brokenFallback: AiFallbackHandler = vi.fn().mockRejectedValue(
      new Error("AI service down")
    );

    const result = await humanize("totally_unrecognisable_xyz_error_abc999", {
      aiFallback: brokenFallback,
      verbose: true,
    });

    // Should still return a result (generic fallback), not throw
    expect(result.title).toBeDefined();
    expect(result.confidence).toBeLessThan(0.5);
  });
});

// ── Location extraction ───────────────────────────────────────────────────────

describe("humanize() — location extraction", () => {
  it("extracts location from a real Error object", async () => {
    const err = makeTypeError("Cannot read properties of undefined (reading 'id')");
    const result = await humanize(err);

    // The Error was created in this test file, so location should point here
    expect(result.location).toBeDefined();
    expect(result.location?.lineNumber).toBeGreaterThan(0);
  });

  it("extracts location from a stack trace string", async () => {
    const stack = `TypeError: myFn is not a function
    at doWork (/app/services/worker.ts:88:14)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;

    const result = await humanize(stack);
    expect(result.location?.fileName).toBe("/app/services/worker.ts");
    expect(result.location?.lineNumber).toBe(88);
    expect(result.location?.functionName).toBe("doWork");
  });
});

// ── Error-specific correctness ────────────────────────────────────────────────

describe("humanize() — error-specific correctness", () => {
  it("gives correct explanation for ECONNREFUSED", async () => {
    const result = await humanize("connect ECONNREFUSED 127.0.0.1:5432");
    expect(result.explanation.toLowerCase()).toContain("refused");
    expect(result.suggestions.some((s) => s.toLowerCase().includes("running"))).toBe(true);
  });

  it("gives correct explanation for HTTP 401", async () => {
    const result = await humanize("Request failed with status code 401");
    expect(result.title).toBe("HTTP 401 Error");
    expect(result.explanation.toLowerCase()).toContain("authentication");
    expect(result.suggestions.some((s) => s.toLowerCase().includes("token") || s.toLowerCase().includes("key"))).toBe(true);
  });

  it("gives correct explanation for HTTP 429", async () => {
    const result = await humanize("Request failed with status code 429");
    expect(result.title).toBe("HTTP 429 Error");
    expect(result.explanation.toLowerCase()).toContain("rate");
    expect(result.suggestions.some((s) => s.toLowerCase().includes("back-off") || s.toLowerCase().includes("retry"))).toBe(true);
  });

  it("gives correct explanation for Unexpected end of JSON input", async () => {
    const result = await humanize("Unexpected end of JSON input");
    expect(result.explanation.toLowerCase()).toContain("json");
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it("gives correct explanation for TDZ error", async () => {
    const result = await humanize("Cannot access 'myLet' before initialization");
    expect(result.explanation.toLowerCase()).toContain("let");
    expect(result.suggestions.some((s) => s.includes("myLet"))).toBe(true);
  });

  it("gives correct explanation for require not defined", async () => {
    const result = await humanize("require is not defined");
    // Should match the specific module pattern, not the generic ref pattern
    expect(result.title).toContain("require()");
    expect(result.explanation.toLowerCase()).toContain("module");
    expect(result.suggestions.some((s) => s.includes("import"))).toBe(true);
  });
});

// ── registerPattern ────────────────────────────────────────────────────────────

describe("registerPattern()", () => {
  it("registers and matches a custom pattern", async () => {
    registerPattern({
      id: "integration.my_custom",
      name: "My Custom Error",
      matcher: /MY_APP_ERROR_CODE_(?<code>\d+)/,
      extractor(match) {
        return { code: match.groups?.["code"] ?? "0" };
      },
      titleBuilder: ({ code }) => `App Error Code ${code}`,
      explanationBuilder: ({ code }) => `Custom app error with code ${code}.`,
      causesBuilder: () => ["Custom cause A", "Custom cause B"],
      suggestionsBuilder: () => ["Check docs for error code"],
      confidence: 0.99,
    });

    const result = await humanize("MY_APP_ERROR_CODE_404 triggered");
    expect(result.title).toBe("App Error Code 404");
    expect(result.confidence).toBe(0.99);
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe("humanize() — edge cases", () => {
  it("handles empty string input without throwing", async () => {
    await expect(humanize("")).resolves.toBeDefined();
  });

  it("handles a very long error message", async () => {
    const longMsg = "x".repeat(10_000) + " is not a function";
    const result = await humanize(longMsg);
    expect(result).toBeDefined();
  });

  it("handles concurrent calls without interference", async () => {
    const inputs = [
      "Cannot read properties of undefined (reading 'foo')",
      "myVar is not defined",
      "Unexpected end of JSON input",
      "Request failed with status code 500",
      "Cannot find module 'axios'",
    ];

    const results = await Promise.all(inputs.map((i) => humanize(i)));
    expect(results).toHaveLength(inputs.length);
    for (const r of results) {
      expect(r.confidence).toBeGreaterThan(0.8);
    }
  });
});
