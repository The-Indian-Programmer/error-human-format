import { describe, it, expect } from "vitest";
import { findMatch } from "../../src/core/matcher.js";
import { PatternRegistry } from "../../src/core/registry.js";

function makeRegistry() {
  return new PatternRegistry();
}

describe("findMatch — TypeError patterns", () => {
  const registry = makeRegistry();

  it("matches 'Cannot read properties of undefined'", () => {
    const msg = "Cannot read properties of undefined (reading 'id')";
    const result = findMatch(msg, registry);

    expect(result).not.toBeNull();
    expect(result!.pattern.id).toBe("type_error.cannot_read_props");
    expect(result!.groups["nullish"]).toBe("undefined");
    expect(result!.groups["prop"]).toBe("id");
  });

  it("matches 'Cannot read properties of null'", () => {
    const msg = "Cannot read properties of null (reading 'name')";
    const result = findMatch(msg, registry);

    expect(result!.pattern.id).toBe("type_error.cannot_read_props");
    expect(result!.groups["nullish"]).toBe("null");
    expect(result!.groups["prop"]).toBe("name");
  });

  it("matches 'is not a function'", () => {
    const msg = "myModule.init is not a function";
    const result = findMatch(msg, registry);

    expect(result!.pattern.id).toBe("type_error.not_a_function");
    expect(result!.groups["expr"]).toBe("myModule.init");
  });

  it("matches 'is not iterable'", () => {
    const result = findMatch("undefined is not iterable", registry);
    expect(result!.pattern.id).toBe("type_error.not_iterable");
  });

  it("matches 'Cannot set properties of undefined'", () => {
    const msg = "Cannot set properties of undefined (setting 'value')";
    const result = findMatch(msg, registry);

    expect(result!.pattern.id).toBe("type_error.cannot_set_props");
    expect(result!.groups["prop"]).toBe("value");
  });

  it("matches 'Cannot convert undefined or null to object'", () => {
    const msg = "Cannot convert undefined or null to object";
    const result = findMatch(msg, registry);
    expect(result!.pattern.id).toBe("type_error.null_to_object");
  });
});

describe("findMatch — ReferenceError patterns", () => {
  const registry = makeRegistry();

  it("matches 'X is not defined'", () => {
    const result = findMatch("myVar is not defined", registry);

    expect(result!.pattern.id).toBe("ref_error.not_defined");
    expect(result!.groups["variable"]).toBe("myVar");
  });

  it("matches temporal dead zone error", () => {
    const msg = "Cannot access 'myConst' before initialization";
    const result = findMatch(msg, registry);

    expect(result!.pattern.id).toBe("ref_error.tdz");
    expect(result!.groups["variable"]).toBe("myConst");
  });
});

describe("findMatch — SyntaxError / JSON patterns", () => {
  const registry = makeRegistry();

  it("matches 'Unexpected end of JSON input'", () => {
    const result = findMatch("Unexpected end of JSON input", registry);
    expect(result!.pattern.id).toBe("syntax_error.unexpected_end_json");
  });

  it("matches unexpected token", () => {
    const result = findMatch("Unexpected token '<'", registry);
    expect(result!.pattern.id).toBe("syntax_error.unexpected_token");
    expect(result!.groups["token"]).toBe("<");
  });

  it("matches 'Unexpected non-whitespace character after JSON'", () => {
    const result = findMatch(
      "Unexpected non-whitespace character after JSON at position 42",
      registry
    );
    expect(result!.pattern.id).toBe("syntax_error.invalid_json_char");
  });
});

describe("findMatch — network error patterns", () => {
  const registry = makeRegistry();

  it("matches ECONNREFUSED", () => {
    const result = findMatch("connect ECONNREFUSED 127.0.0.1:3000", registry);
    expect(result!.pattern.id).toBe("network.axios_network_error");
  });

  it("matches ENOTFOUND", () => {
    const result = findMatch("getaddrinfo ENOTFOUND api.example.com", registry);
    expect(result!.pattern.id).toBe("network.axios_network_error");
  });

  it("matches HTTP 404", () => {
    const result = findMatch("Request failed with status code 404", registry);
    expect(result!.pattern.id).toBe("network.http_error_status");
    expect(result!.groups["status"]).toBe("404");
  });

  it("matches HTTP 429", () => {
    const result = findMatch("Request failed with status code 429", registry);
    expect(result!.pattern.id).toBe("network.http_error_status");
    expect(result!.groups["status"]).toBe("429");
  });

  it("matches Failed to fetch", () => {
    const result = findMatch("Failed to fetch", registry);
    expect(result!.pattern.id).toBe("network.fetch_failed");
  });
});

describe("findMatch — promise/async patterns", () => {
  const registry = makeRegistry();

  it("matches UnhandledPromiseRejection", () => {
    const result = findMatch(
      "UnhandledPromiseRejectionWarning: Error: boom",
      registry
    );
    expect(result!.pattern.id).toBe("promise.unhandled_rejection");
  });

  it("matches await outside async", () => {
    const result = findMatch(
      "await is only valid in async function",
      registry
    );
    expect(result!.pattern.id).toBe("promise.await_outside_async");
  });
});

describe("findMatch — module patterns", () => {
  const registry = makeRegistry();

  it("matches Cannot find module (npm package)", () => {
    const result = findMatch("Cannot find module 'express'", registry);
    expect(result!.pattern.id).toBe("module.cannot_find");
    expect(result!.groups["module"]).toBe("express");
  });

  it("matches Cannot find module (relative path)", () => {
    const result = findMatch("Cannot find module './utils/helper'", registry);
    expect(result!.pattern.id).toBe("module.cannot_find");
    expect(result!.groups["module"]).toBe("./utils/helper");
  });

  it("matches require is not defined", () => {
    const result = findMatch("require is not defined", registry);
    expect(result!.pattern.id).toBe("module.require_not_defined");
  });

  it("matches named export not found", () => {
    const result = findMatch(
      "does not provide an export named 'createServer'",
      registry
    );
    expect(result!.pattern.id).toBe("module.named_export_missing");
    expect(result!.groups["export"]).toBe("createServer");
  });
});

describe("findMatch — no match cases", () => {
  const registry = makeRegistry();

  it("returns null for unrecognised error messages", () => {
    expect(findMatch("Something totally weird happened", registry)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(findMatch("", registry)).toBeNull();
  });
});

describe("PatternRegistry", () => {
  it("allows registering a custom pattern", () => {
    const reg = makeRegistry();
    const initialSize = reg.size;

    reg.register({
      id: "test.custom",
      name: "Custom Test Pattern",
      matcher: /CUSTOM_ERROR_XYZ/,
      titleBuilder: () => "Custom Error",
      explanationBuilder: () => "A custom test error.",
      causesBuilder: () => ["Custom cause"],
      suggestionsBuilder: () => ["Custom suggestion"],
      confidence: 0.99,
    });

    expect(reg.size).toBe(initialSize + 1);

    const result = findMatch("CUSTOM_ERROR_XYZ occurred", reg);
    expect(result!.pattern.id).toBe("test.custom");
  });

  it("allows overriding a built-in pattern by reusing its ID", () => {
    const reg = makeRegistry();

    reg.register({
      id: "ref_error.not_defined",
      name: "Overridden Pattern",
      matcher: /(\w+) is not defined/,
      titleBuilder: () => "OVERRIDDEN",
      explanationBuilder: () => "Overridden explanation",
      causesBuilder: () => [],
      suggestionsBuilder: () => [],
      confidence: 0.5,
    });

    const result = findMatch("foo is not defined", reg);
    expect(result!.pattern.name).toBe("Overridden Pattern");
  });

  it("returns patterns sorted by confidence descending", () => {
    const reg = makeRegistry();
    const sorted = reg.getSorted();

    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i]!.confidence).toBeGreaterThanOrEqual(
        sorted[i + 1]!.confidence
      );
    }
  });
});
