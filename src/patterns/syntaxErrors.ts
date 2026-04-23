import type { ErrorPattern } from "../types/index.js";

const syntaxErrorPatterns: ErrorPattern[] = [
  // ─── Unexpected token ───────────────────────────────────────────────────
  {
    id: "syntax_error.unexpected_token",
    name: "Unexpected token",
    matcher: /Unexpected token\s*(?:'(?<token>[^']+)')?/,
    extractor(match: RegExpMatchArray) {
      return { token: match.groups?.["token"] ?? "<unknown>" };
    },
    titleBuilder: ({ token }) =>
      token !== "<unknown>"
        ? `Unexpected token "${token}"`
        : "Unexpected token in source code",
    explanationBuilder: ({ token }) =>
      `The JavaScript parser encountered ${token !== "<unknown>" ? `the token "${token}"` : "an unexpected token"} ` +
      `at a position where it isn't valid. This is a structural/syntax issue in the source code.`,
    causesBuilder: () => [
      "Missing or extra bracket, brace, or parenthesis",
      "A comma placed where a semicolon or nothing was expected",
      "Attempting to use ES module syntax (import/export) in a CommonJS context",
      "An arrow function body that is syntactically invalid",
      "A trailing comma in older JS environments that don't support it",
    ],
    suggestionsBuilder: () => [
      "Check the line number in the error and look for mismatched brackets / braces",
      "Use a linter (ESLint) or your editor's bracket-matching feature",
      "If using `import`/`export`, ensure `\"type\": \"module\"` is set in package.json or use `.mjs` extension",
      "Validate JSON strings with `JSON.parse()` after escaping them properly",
    ],
    confidence: 0.85,
    tags: ["syntax-error"],
  },

  // ─── Unexpected end of JSON input ───────────────────────────────────────
  {
    id: "syntax_error.unexpected_end_json",
    name: "Unexpected end of JSON input",
    matcher: /Unexpected end of JSON input/,
    extractor: () => ({}),
    titleBuilder: () => "Malformed JSON: Unexpected end of input",
    explanationBuilder: () =>
      "The JSON string ended before the parser expected it to. " +
      "This usually means the JSON is truncated, improperly stringified, or partially received.",
    causesBuilder: () => [
      "The JSON string was cut off mid-transfer (e.g. network timeout)",
      "An empty string was passed to `JSON.parse()`",
      "A template literal or concatenation produced broken JSON",
      "The server returned an HTML error page instead of JSON",
    ],
    suggestionsBuilder: () => [
      "Log the raw string before parsing: `console.log(rawString)` to inspect it",
      "Guard against empty responses: `if (!raw || raw.trim() === '') return null`",
      "Check the Content-Type header of the HTTP response (it should be application/json)",
      "Use a try/catch around `JSON.parse()` and handle parse errors gracefully",
    ],
    confidence: 0.98,
    tags: ["syntax-error", "json"],
  },

  // ─── Unexpected non-whitespace character after JSON ──────────────────────
  {
    id: "syntax_error.invalid_json_char",
    name: "Invalid character in JSON",
    matcher: /Unexpected non-whitespace character after JSON/,
    extractor: () => ({}),
    titleBuilder: () => "Invalid characters after JSON value",
    explanationBuilder: () =>
      "The parser found unexpected characters after a valid JSON value. " +
      "The input likely contains multiple concatenated JSON objects or extra trailing data.",
    causesBuilder: () => [
      "Concatenating two JSON strings without a wrapper array or object",
      "Extra data appended after the closing `}` or `]`",
      "Using `JSON.parse()` on NDJSON (newline-delimited JSON) directly",
    ],
    suggestionsBuilder: () => [
      "Parse one JSON object at a time — split on newlines for NDJSON",
      "Wrap multiple objects in an array before stringifying: `JSON.stringify([obj1, obj2])`",
      "Trim the string before parsing: `JSON.parse(str.trim())`",
    ],
    confidence: 0.95,
    tags: ["syntax-error", "json"],
  },

  // ─── Strict mode / reserved word ────────────────────────────────────────
  {
    id: "syntax_error.strict_mode",
    name: "Strict mode violation",
    matcher: /(?:Strict mode|'(?<word>[^']+)' is a reserved word)/,
    extractor(match: RegExpMatchArray) {
      return { word: match.groups?.["word"] ?? "" };
    },
    titleBuilder: ({ word }) =>
      word ? `"${word}" is a reserved word` : "Strict mode violation",
    explanationBuilder: ({ word }) =>
      word
        ? `"${word}" is a reserved word in JavaScript and cannot be used as an identifier.`
        : "This code violates JavaScript strict mode rules ('use strict').`,",
    causesBuilder: ({ word }) => [
      word
        ? `Using "${word}" as a variable, function, or parameter name`
        : "Duplicate parameter names in a function",
      "Assigning to a read-only property",
      "Deleting a plain variable name",
    ],
    suggestionsBuilder: ({ word }) => [
      word ? `Rename the identifier — avoid using "${word}"` : "Review strict mode restrictions",
      "Remove 'use strict' only if you understand the implications",
    ],
    confidence: 0.88,
    tags: ["syntax-error", "strict-mode"],
  },
];

export default syntaxErrorPatterns;
