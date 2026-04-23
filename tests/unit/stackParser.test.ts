import { describe, it, expect } from "vitest";
import {
  parseStackTrace,
  getMostRelevantFrame,
  formatFrame,
} from "../../src/utils/stackParser.js";

describe("parseStackTrace", () => {
  it("parses a standard V8 stack trace", () => {
    const stack = `TypeError: Cannot read properties of undefined (reading 'id')
    at Object.<anonymous> (/app/src/index.js:10:5)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at node:internal/modules/cjs/loader:1415:10`;

    const frames = parseStackTrace(stack);
    expect(frames.length).toBeGreaterThanOrEqual(1);

    const first = frames[0]!;
    expect(first.fileName).toBe("/app/src/index.js");
    expect(first.lineNumber).toBe(10);
    expect(first.columnNumber).toBe(5);
    expect(first.functionName).toBe("Object.<anonymous>");
  });

  it("parses async stack frames", () => {
    const stack = `Error: Something failed
    at async handleRequest (/app/src/handler.ts:42:8)
    at async Promise.all (index 0)`;

    const frames = parseStackTrace(stack);
    expect(frames[0]?.functionName).toContain("handleRequest");
    expect(frames[0]?.lineNumber).toBe(42);
  });

  it("marks node_modules frames as native", () => {
    const stack = `Error: fail
    at doThing (/app/node_modules/some-lib/index.js:5:10)
    at myHandler (/app/src/app.ts:20:3)`;

    const frames = parseStackTrace(stack);
    expect(frames[0]?.isNative).toBe(true);
    expect(frames[1]?.isNative).toBe(false);
  });

  it("marks node: internal frames as native", () => {
    const stack = `Error: fail
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;

    const frames = parseStackTrace(stack);
    expect(frames[0]?.isNative).toBe(true);
  });

  it("returns empty array for empty string", () => {
    expect(parseStackTrace("")).toHaveLength(0);
  });

  it("returns empty array for a string with no 'at' lines", () => {
    expect(parseStackTrace("Just a message\nno frames here")).toHaveLength(0);
  });

  it("handles SpiderMonkey-style frames", () => {
    const stack = `TypeError: x is not a function
myFunc@/app/src/main.js:15:9
@/app/src/main.js:1:1`;

    const frames = parseStackTrace(stack);
    expect(frames[0]?.functionName).toBe("myFunc");
    expect(frames[0]?.lineNumber).toBe(15);
  });
});

describe("getMostRelevantFrame", () => {
  it("prefers user code over node internals", () => {
    const frames = [
      {
        functionName: "processTicksAndRejections",
        fileName: "node:internal/process/task_queues",
        lineNumber: 95,
        isNative: true,
      },
      {
        functionName: "myHandler",
        fileName: "/app/src/handler.ts",
        lineNumber: 20,
        isNative: false,
      },
    ];

    const frame = getMostRelevantFrame(frames);
    expect(frame?.functionName).toBe("myHandler");
    expect(frame?.isRelevant).toBe(true);
  });

  it("returns undefined for empty frames", () => {
    expect(getMostRelevantFrame([])).toBeUndefined();
  });

  it("falls back to first frame when all are native", () => {
    const frames = [
      {
        functionName: "processTicksAndRejections",
        fileName: "node:internal/process/task_queues",
        lineNumber: 95,
        isNative: true,
      },
    ];
    const frame = getMostRelevantFrame(frames);
    expect(frame).toBeDefined();
    expect(frame?.isRelevant).toBe(true);
  });
});

describe("formatFrame", () => {
  it("formats file + line + column + function", () => {
    const frame = {
      functionName: "handleRequest",
      fileName: "/app/src/handler.ts",
      lineNumber: 42,
      columnNumber: 8,
    };
    expect(formatFrame(frame)).toBe("/app/src/handler.ts:42:8 (handleRequest)");
  });

  it("omits column when not present", () => {
    const frame = {
      functionName: "doSomething",
      fileName: "/app/src/util.ts",
      lineNumber: 10,
    };
    expect(formatFrame(frame)).toBe("/app/src/util.ts:10 (doSomething)");
  });

  it("handles frame with only fileName", () => {
    expect(formatFrame({ fileName: "/app/src/index.ts" })).toBe("/app/src/index.ts");
  });

  it("handles empty frame gracefully", () => {
    expect(formatFrame({})).toBe("");
  });
});
