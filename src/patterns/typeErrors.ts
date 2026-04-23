import type { ErrorPattern } from "../types/index.js";

/**
 * Patterns for TypeError variants.
 *
 * V8 examples:
 *   TypeError: Cannot read properties of undefined (reading 'foo')
 *   TypeError: Cannot read properties of null (reading 'bar')
 *   TypeError: undefined is not a function
 *   TypeError: foo.bar is not a function
 *   TypeError: Cannot set properties of undefined (setting 'x')
 *   TypeError: X is not iterable
 *   TypeError: Cannot convert undefined or null to object
 */

const typeErrorPatterns: ErrorPattern[] = [
  // ─── Cannot read properties of undefined/null ───────────────────────────
  {
    id: "type_error.cannot_read_props",
    name: "Cannot read properties of undefined/null",
    matcher:
      /Cannot read propert(?:y|ies) of (?<nullish>undefined|null)(?: \(reading '(?<prop>[^']+)'\))?/,
    extractor(match: RegExpMatchArray) {
      return {
        nullish: match.groups?.["nullish"] ?? "undefined",
        prop: match.groups?.["prop"] ?? "<unknown>",
      };
    },
    titleBuilder: ({ nullish, prop }) =>
      `Accessed property "${prop}" on ${nullish}`,
    explanationBuilder: ({ nullish, prop }) =>
      `You tried to read the property "${prop}" from a value that is ${nullish}. ` +
      `This usually means a variable was never assigned, an async operation hadn't finished yet, ` +
      `or an API/function returned ${nullish} instead of the expected object.`,
    causesBuilder: ({ nullish }) => [
      `A variable was declared but never initialised (it stayed ${nullish})`,
      "An asynchronous operation completed but the result wasn't awaited",
      "An API call or function returned an unexpected null/undefined",
      "A conditional branch left the variable unset for this code path",
      "A destructuring pattern silently produced an undefined binding",
    ],
    suggestionsBuilder: ({ prop, nullish }) => [
      `Add a null-check before accessing the property: \`if (obj != null) { obj.${prop} … }\``,
      `Use optional chaining: \`obj?.${prop}\``,
      `Use nullish coalescing as a fallback: \`(obj ?? defaultValue).${prop}\``,
      `Verify the variable is properly initialised before this line`,
      nullish === "undefined"
        ? 'Check whether you are missing an `await` keyword before the expression'
        : 'Ensure the function/API that returns this value handles the null case',
    ],
    confidence: 0.97,
    tags: ["type-error", "null-access"],
  },

  // ─── Cannot set properties of undefined/null ────────────────────────────
  {
    id: "type_error.cannot_set_props",
    name: "Cannot set properties of undefined/null",
    matcher:
      /Cannot set propert(?:y|ies) of (?<nullish>undefined|null)(?: \(setting '(?<prop>[^']+)'\))?/,
    extractor(match: RegExpMatchArray) {
      return {
        nullish: match.groups?.["nullish"] ?? "undefined",
        prop: match.groups?.["prop"] ?? "<unknown>",
      };
    },
    titleBuilder: ({ nullish, prop }) =>
      `Cannot set "${prop}" on ${nullish}`,
    explanationBuilder: ({ nullish, prop }) =>
      `You attempted to assign a value to the property "${prop}" on something that is ${nullish}. ` +
      `JavaScript cannot add properties to ${nullish} values.`,
    causesBuilder: () => [
      "The target object was never created (missing `new` or initialisation)",
      "The object was expected but an async call returned null/undefined",
      "The variable was re-assigned to null/undefined elsewhere before this line",
    ],
    suggestionsBuilder: ({ prop }) => [
      `Ensure the target object is created before setting \`.${prop}\``,
      `Use optional chaining assignment: \`obj?.${prop} = value\``,
      "Trace back where the variable is first set and verify it holds an object",
    ],
    confidence: 0.95,
    tags: ["type-error", "null-access"],
  },

  // ─── X is not a function ────────────────────────────────────────────────
  {
    id: "type_error.not_a_function",
    name: "Value is not a function",
    matcher: /(?<expr>.+?) is not a function/,
    extractor(match: RegExpMatchArray) {
      return { expr: match.groups?.["expr"]?.trim() ?? "<unknown>" };
    },
    titleBuilder: ({ expr }) => `"${expr}" is not a function`,
    explanationBuilder: ({ expr }) =>
      `You called \`${expr}()\` but the value at that path is not a callable function at runtime. ` +
      `This often happens when a module export is wrong, a method name is misspelled, ` +
      `or the variable holds a different type (e.g. undefined, a number, or an object).`,
    causesBuilder: () => [
      "A method name is misspelled (case-sensitive)",
      "The import/require path resolves to a non-function export",
      "The variable was overwritten with a non-function value earlier",
      "Using a CommonJS default export without `.default`",
      "A prototype method that doesn't exist on this instance",
    ],
    suggestionsBuilder: ({ expr }) => [
      `Log the value before calling it: \`console.log(typeof ${expr})\``,
      "Verify the import is correct and the module exports a function",
      "Check for typos in the method name — JavaScript is case-sensitive",
      "If using ESM/CJS interop, check whether you need `.default`",
    ],
    confidence: 0.9,
    tags: ["type-error", "not-a-function"],
  },

  // ─── X is not iterable ──────────────────────────────────────────────────
  {
    id: "type_error.not_iterable",
    name: "Value is not iterable",
    matcher: /(?<expr>.+?) is not iterable/,
    extractor(match: RegExpMatchArray) {
      return { expr: match.groups?.["expr"]?.trim() ?? "<unknown>" };
    },
    titleBuilder: ({ expr }) => `"${expr}" is not iterable`,
    explanationBuilder: ({ expr }) =>
      `You tried to iterate over \`${expr}\` (e.g. with \`for…of\`, spread, or destructuring) ` +
      `but its value does not implement the iterable protocol. ` +
      `Only arrays, strings, Maps, Sets, and objects with [Symbol.iterator] are iterable.`,
    causesBuilder: () => [
      "Spreading or destructuring a plain object `{ }` instead of an array `[ ]`",
      "An API returned an object instead of the expected array",
      "A missing `await` caused a Promise to be iterated instead of its resolved value",
      "The value is null or undefined",
    ],
    suggestionsBuilder: () => [
      "Verify the value is an array: `Array.isArray(value)`",
      "Convert objects to entries if needed: `Object.entries(obj)`",
      "Ensure async data is awaited before iteration",
      "Wrap with `Array.from()` if working with array-like or generator values",
    ],
    confidence: 0.92,
    tags: ["type-error", "iterable"],
  },

  // ─── Cannot convert undefined or null to object ─────────────────────────
  {
    id: "type_error.null_to_object",
    name: "Cannot convert null/undefined to object",
    matcher: /Cannot convert (?<val>undefined|null) (?:or (?:null|undefined) )?to object/,
    extractor(match: RegExpMatchArray) {
      return { val: match.groups?.["val"] ?? "null/undefined" };
    },
    titleBuilder: () => "Tried to convert null/undefined to an object",
    explanationBuilder: () =>
      "A built-in method like `Object.keys()`, `Object.entries()`, or `Object.assign()` " +
      "was called with null or undefined as the target argument.",
    causesBuilder: () => [
      "Passing a nullable variable directly to `Object.keys()` / `Object.entries()`",
      "An API response was null but was expected to be an object",
    ],
    suggestionsBuilder: () => [
      "Guard before calling: `if (value != null) Object.keys(value)`",
      "Use a fallback: `Object.keys(value ?? {})`",
    ],
    confidence: 0.93,
    tags: ["type-error", "null-access"],
  },
];

export default typeErrorPatterns;
