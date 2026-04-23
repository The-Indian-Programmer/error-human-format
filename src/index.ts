/**
 * error-humanizer
 *
 * Intelligent error explanation engine for JavaScript / Node.js.
 *
 * @example
 * ```ts
 * import { humanize, registerPattern } from 'error-humanizer';
 *
 * const result = await humanize(
 *   new TypeError("Cannot read properties of undefined (reading 'id')")
 * );
 *
 * console.log(result.title);       // "Accessed property "id" on undefined"
 * console.log(result.explanation); // ...
 * console.log(result.suggestions); // [...]
 * ```
 */

export { humanize, registerPattern } from "./core/humanizer.js";

export type {
  ErrorInput,
  HumanizeOptions,
  HumanizedError,
  ErrorPattern,
  StackFrame,
  AiFallbackHandler,
} from "./types/index.js";

// Expose low-level utilities for power users / plugin authors
export { parseStackTrace, getMostRelevantFrame, formatFrame } from "./utils/stackParser.js";
export { normalizeError } from "./utils/normalizer.js";
export { registry } from "./core/registry.js";
