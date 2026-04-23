import type { StackFrame } from "../types/index.js";

/**
 * Regexes for different V8 / SpiderMonkey stack frame formats.
 *
 * V8 examples:
 *   at Object.<anonymous> (/app/src/index.js:10:5)
 *   at async Promise.all (index 0)
 *   at processTicksAndRejections (node:internal/process/task_queues:95:5)
 */
const V8_FRAME =
  /^\s*at\s+(?:(?<fn>[^(]+?)\s+\()?(?<file>[^)]+?):(?<line>\d+):(?<col>\d+)\)?$/;

const V8_FRAME_NO_LOCATION = /^\s*at\s+(?<fn>.+)$/;

// SpiderMonkey (Firefox) format: functionName@file:line:col
const SPIDER_FRAME = /^(?<fn>[^@]*)@(?<file>.+):(?<line>\d+):(?<col>\d+)$/;

/**
 * Filters that identify frames likely authored by the user (not internals).
 */
const NOISE_PATTERNS = [
  /node:internal/,
  /node_modules\//,
  /\(internal\//,
  /<anonymous>/,
  /processTicksAndRejections/,
];

function isNoise(fileName: string): boolean {
  return NOISE_PATTERNS.some((p) => p.test(fileName));
}

/**
 * Parse a single stack line into a StackFrame.
 * Returns null when the line cannot be parsed.
 */
function parseLine(line: string): StackFrame | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("at ") && !trimmed.includes("@")) return null;

  // Try V8 with location
  let m = trimmed.match(V8_FRAME);
  if (m?.groups) {
    const { fn, file, line: ln, col } = m.groups as Record<string, string>;
    const fileName = fn === undefined ? file ?? "" : file ?? "";
    return {
      functionName: fn?.trim() || undefined,
      fileName: fileName || undefined,
      lineNumber: ln ? parseInt(ln, 10) : undefined,
      columnNumber: col ? parseInt(col, 10) : undefined,
      isNative: fileName ? isNoise(fileName) : false,
    };
  }

  // Try SpiderMonkey
  m = trimmed.match(SPIDER_FRAME);
  if (m?.groups) {
    const { fn, file, line: ln, col } = m.groups as Record<string, string>;
    return {
      functionName: fn?.trim() || undefined,
      fileName: file || undefined,
      lineNumber: ln ? parseInt(ln, 10) : undefined,
      columnNumber: col ? parseInt(col, 10) : undefined,
      isNative: file ? isNoise(file) : false,
    };
  }

  // Try V8 without location (e.g., "at native")
  m = trimmed.match(V8_FRAME_NO_LOCATION);
  if (m?.groups) {
    return {
      functionName: m.groups["fn"]?.trim() || undefined,
      isNative: true,
    };
  }

  return null;
}

/**
 * Parse a full stack trace string into an array of StackFrames.
 *
 * @param stack - Raw stack trace string
 * @returns Ordered array of frames (top frame first)
 */
export function parseStackTrace(stack: string): StackFrame[] {
  const lines = stack.split("\n");
  const frames: StackFrame[] = [];

  for (const line of lines) {
    const frame = parseLine(line);
    if (frame) frames.push(frame);
  }

  return frames;
}

/**
 * Identify the most relevant (user-authored) frame from a list of frames.
 * Prioritises non-native frames with a real file path.
 *
 * @param frames - Full list of parsed frames
 * @returns The single most relevant frame, or undefined if none found
 */
export function getMostRelevantFrame(
  frames: StackFrame[]
): StackFrame | undefined {
  const userFrames = frames.filter((f) => !f.isNative && f.fileName);
  if (userFrames.length > 0) {
    const frame = { ...userFrames[0]!, isRelevant: true };
    return frame;
  }

  // Fallback: just return the first frame we have
  return frames[0] ? { ...frames[0], isRelevant: true } : undefined;
}

/**
 * Compact a frame into a human-readable location string.
 * e.g. "src/app.ts:42:8 (handleRequest)"
 */
export function formatFrame(frame: StackFrame): string {
  const parts: string[] = [];

  if (frame.fileName) {
    let loc = frame.fileName;
    if (frame.lineNumber !== undefined) {
      loc += `:${frame.lineNumber}`;
      if (frame.columnNumber !== undefined) {
        loc += `:${frame.columnNumber}`;
      }
    }
    parts.push(loc);
  }

  if (frame.functionName) {
    parts.push(`(${frame.functionName})`);
  }

  return parts.join(" ");
}
