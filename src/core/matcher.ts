import type { ErrorPattern, HumanizedError } from "../types/index.js";
import type { PatternRegistry } from "./registry.js";
import type { StackFrame } from "../types/index.js";

interface MatchResult {
  pattern: ErrorPattern;
  groups: Record<string, string>;
  rawMatch: RegExpMatchArray;
}

/**
 * Find the first matching pattern for a given error message.
 *
 * Patterns are tested in descending confidence order, so the most specific
 * (highest-confidence) match wins. Pattern matchers use RegExp.exec() which
 * is fast and does not backtrack globally.
 *
 * @param message - Normalised error message string
 * @param registry - Pattern registry instance
 * @returns MatchResult or null if nothing matched
 */
export function findMatch(
  message: string,
  registry: PatternRegistry
): MatchResult | null {
  for (const pattern of registry.getSorted()) {
    // Reset stateful regex (if the flag 'g' or 'y' was used — defensive)
    const regex = new RegExp(pattern.matcher.source, pattern.matcher.flags.replace(/[gy]/g, ""));
    const match = regex.exec(message);

    if (match) {
      // Run optional extractor, or fall back to named groups
      const groups: Record<string, string> =
        typeof pattern.extractor === "function"
          ? pattern.extractor(match)
          : (match.groups as Record<string, string>) ?? {};

      return { pattern, groups, rawMatch: match };
    }
  }
  return null;
}

/**
 * Build the final HumanizedError from a MatchResult.
 */
export function buildResult(
  matchResult: MatchResult,
  location: StackFrame | undefined,
  rawStack: string | undefined,
  includeStack: boolean
): HumanizedError {
  const { pattern, groups } = matchResult;

  const result: HumanizedError = {
    title: pattern.titleBuilder(groups),
    explanation: pattern.explanationBuilder(groups),
    possibleCauses: pattern.causesBuilder(groups),
    suggestions: pattern.suggestionsBuilder(groups),
    confidence: pattern.confidence,
  };

  if (location) result.location = location;
  if (includeStack && rawStack) result.stack = rawStack;

  return result;
}

/**
 * Build a generic fallback result when no pattern matched and no AI fallback
 * was provided.
 */
export function buildFallbackResult(
  message: string,
  errorType: string | undefined,
  location: StackFrame | undefined,
  rawStack: string | undefined,
  includeStack: boolean
): HumanizedError {
  const result: HumanizedError = {
    title: errorType ? `${errorType} occurred` : "An error occurred",
    explanation:
      message ||
      "An unexpected error occurred. No pattern matched this error message.",
    possibleCauses: [
      "An unhandled edge case in the application logic",
      "A dependency behaving unexpectedly",
      "A race condition or timing issue",
    ],
    suggestions: [
      "Add the full stack trace to understand where the error originates",
      "Search the exact error message online or in the relevant library's issue tracker",
      "Add detailed logging around the code path that produced this error",
      "Check recent code changes that could have introduced this regression",
    ],
    confidence: 0.1,
  };

  if (location) result.location = location;
  if (errorType) result.errorType = errorType;
  if (includeStack && rawStack) result.stack = rawStack;

  return result;
}
