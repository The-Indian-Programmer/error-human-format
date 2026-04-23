import type { ErrorInput } from "../types/index.js";

export interface NormalizedError {
  message: string;
  stack?: string | undefined;
  errorType?: string | undefined;
  name?: string | undefined;
}

/**
 * Normalize any accepted ErrorInput shape into a common structure.
 *
 * Handles:
 *  - native Error / subclass instances
 *  - plain strings (treated as the error message)
 *  - objects with { message, stack? }
 */
export function normalizeError(input: ErrorInput): NormalizedError {
  if (typeof input === "string") {
    // The string might itself be a full stack trace (starts with "ErrorType: …")
    const firstLine = input.split("\n")[0]?.trim() ?? "";
    const typeMatch = firstLine.match(/^(?<type>\w+Error)\s*:/);

    return {
      message: input,
      stack: input.includes("\n    at ") ? input : undefined,
      errorType: typeMatch?.groups?.["type"],
      name: typeMatch?.groups?.["type"],
    };
  }

  if (input instanceof Error) {
    return {
      message: input.message,
      stack: input.stack,
      errorType: input.constructor.name !== "Error"
        ? input.constructor.name
        : input.name,
      name: input.name,
    };
  }

  // Plain object with { message, stack? }
  const firstLine = (input.message ?? "").split("\n")[0]?.trim() ?? "";
  const typeMatch = firstLine.match(/^(?<type>\w+Error)\s*:/);

  return {
    message: input.message ?? "",
    stack: input.stack,
    errorType: typeMatch?.groups?.["type"],
    name: typeMatch?.groups?.["type"],
  };
}

/**
 * Extract the core message from a potentially prefixed error string.
 * e.g. "TypeError: Cannot read properties of undefined …"
 *   → "Cannot read properties of undefined …"
 */
export function stripErrorPrefix(message: string): string {
  return message.replace(/^\w+Error:\s*/, "").trim();
}
