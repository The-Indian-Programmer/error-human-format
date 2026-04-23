import type { ErrorPattern } from "../types/index.js";

const referenceErrorPatterns: ErrorPattern[] = [
  // ─── X is not defined ───────────────────────────────────────────────────
  {
    id: "ref_error.not_defined",
    name: "Variable is not defined",
    matcher: /(?<variable>\w+) is not defined/,
    extractor(match: RegExpMatchArray) {
      return { variable: match.groups?.["variable"] ?? "<unknown>" };
    },
    titleBuilder: ({ variable }) => `"${variable}" is not defined`,
    explanationBuilder: ({ variable }) =>
      `JavaScript cannot find a variable, function, or import named "${variable}" ` +
      `in the current or any enclosing scope. This is a ReferenceError at runtime.`,
    causesBuilder: ({ variable }) => [
      `"${variable}" was never declared (missing \`const\`, \`let\`, or \`var\`)`,
      `"${variable}" is a typo of an existing identifier`,
      `The import or require statement for "${variable}" is missing or wrong`,
      `"${variable}" is defined in a different scope that is not accessible here`,
      `The file that exports "${variable}" is not loaded / bundled`,
    ],
    suggestionsBuilder: ({ variable }) => [
      `Declare it: \`const ${variable} = …\``,
      `Check for a typo — JavaScript identifiers are case-sensitive`,
      `Add the missing import: \`import { ${variable} } from './module'\``,
      `Verify the variable is declared before it is used (temporal dead zone)`,
    ],
    confidence: 0.97,
    tags: ["reference-error", "scope"],
  },

  // ─── Temporal Dead Zone (let/const before declaration) ──────────────────
  {
    id: "ref_error.tdz",
    name: "Cannot access before initialisation",
    matcher: /Cannot access '(?<variable>[^']+)' before initialization/,
    extractor(match: RegExpMatchArray) {
      return { variable: match.groups?.["variable"] ?? "<unknown>" };
    },
    titleBuilder: ({ variable }) =>
      `Temporal Dead Zone: "${variable}" accessed before initialisation`,
    explanationBuilder: ({ variable }) =>
      `"${variable}" was declared with \`let\` or \`const\` but you accessed it ` +
      `before the declaration line was executed. Unlike \`var\`, these declarations are NOT hoisted.`,
    causesBuilder: ({ variable }) => [
      `"${variable}" is referenced above its \`let\` / \`const\` declaration in the same block`,
      `A circular module dependency causes one module to import "${variable}" before it is initialised`,
      `A class field or constructor references a \`const\` defined later in the file`,
    ],
    suggestionsBuilder: ({ variable }) => [
      `Move the declaration of "${variable}" above the line that uses it`,
      `Replace \`const\` / \`let\` with \`var\` only if hoisting is intentional (not recommended)`,
      `Resolve the circular dependency by extracting shared code to a third module`,
    ],
    confidence: 0.96,
    tags: ["reference-error", "tdz", "scope"],
  },
];

export default referenceErrorPatterns;
