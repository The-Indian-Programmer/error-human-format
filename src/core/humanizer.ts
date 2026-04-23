import type {
  ErrorInput,
  HumanizeOptions,
  HumanizedError,
  ErrorPattern,
} from "../types/index.js";
import { normalizeError, stripErrorPrefix } from "../utils/normalizer.js";
import { parseStackTrace, getMostRelevantFrame } from "../utils/stackParser.js";
import { registry as globalRegistry } from "./registry.js";
import { findMatch, buildResult, buildFallbackResult } from "./matcher.js";

/**
 * Core API: convert any error input into a structured, human-readable report.
 *
 * @example
 * ```ts
 * import { humanize } from 'error-humanizer';
 *
 * const result = humanize(new TypeError("Cannot read properties of undefined (reading 'id')"));
 * console.log(result.explanation);
 * ```
 */
export async function humanize(
  input: ErrorInput,
  options: HumanizeOptions = {}
): Promise<HumanizedError> {
  const {
    includeStack = false,
    verbose = false,
    debugMode = false,
    aiFallback,
  } = options;

  // 1. Normalise input
  const normalized = normalizeError(input);
  const rawMessage = normalized.message;
  const cleanMessage = stripErrorPrefix(rawMessage);

  if (debugMode) {
    console.debug("[error-humanizer] Normalized:", normalized);
  }

  // 2. Parse stack trace (if present)
  const frames = normalized.stack ? parseStackTrace(normalized.stack) : [];
  const location = getMostRelevantFrame(frames);

  if (debugMode && frames.length > 0) {
    console.debug("[error-humanizer] Parsed frames:", frames.length);
    console.debug("[error-humanizer] Most relevant frame:", location);
  }

  // 3. Try pattern matching — test both the raw message and the stripped version
  const candidateMessages = Array.from(
    new Set([rawMessage, cleanMessage])
  );

  let matchResult = null;
  for (const msg of candidateMessages) {
    matchResult = findMatch(msg, globalRegistry);
    if (matchResult) break;
  }

  if (debugMode) {
    if (matchResult) {
      console.debug("[error-humanizer] Matched pattern:", matchResult.pattern.id);
    } else {
      console.debug("[error-humanizer] No pattern matched. Trying AI fallback.");
    }
  }

  // 4. Build result from match
  if (matchResult) {
    const result = buildResult(
      matchResult,
      location,
      normalized.stack,
      includeStack
    );
    if (normalized.errorType) result.errorType = normalized.errorType;
    return result;
  }

  // 5. AI fallback (if configured)
  if (aiFallback) {
    try {
      const aiResult = await Promise.resolve(
        aiFallback(rawMessage, normalized.errorType)
      );
      if (location) aiResult.location = location;
      if (includeStack && normalized.stack) aiResult.stack = normalized.stack;
      if (normalized.errorType) aiResult.errorType = normalized.errorType;
      return aiResult;
    } catch (fallbackErr) {
      if (verbose) {
        console.warn("[error-humanizer] AI fallback failed:", fallbackErr);
      }
    }
  }

  // 6. Generic fallback
  return buildFallbackResult(
    rawMessage,
    normalized.errorType,
    location,
    normalized.stack,
    includeStack
  );
}

/**
 * Register a custom pattern with the global registry.
 * Custom patterns can override built-in patterns by using the same `id`.
 *
 * @example
 * ```ts
 * import { registerPattern } from 'error-humanizer';
 *
 * registerPattern({
 *   id: 'my_lib.custom_error',
 *   name: 'My Library Custom Error',
 *   matcher: /MyCustomError: (?<reason>.+)/,
 *   titleBuilder: ({ reason }) => `Custom Error: ${reason}`,
 *   explanationBuilder: ({ reason }) => `A custom error occurred: ${reason}`,
 *   causesBuilder: () => ['Custom cause 1', 'Custom cause 2'],
 *   suggestionsBuilder: () => ['Custom suggestion'],
 *   confidence: 0.95,
 * });
 * ```
 */
export function registerPattern(pattern: ErrorPattern): void {
  globalRegistry.register(pattern);
}

// Re-export types for consumers
export type {
  ErrorInput,
  HumanizeOptions,
  HumanizedError,
  ErrorPattern,
} from "../types/index.js";
