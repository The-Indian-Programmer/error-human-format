import type { ErrorPattern } from "../types/index.js";

const moduleErrorPatterns: ErrorPattern[] = [
  // ─── Cannot find module ──────────────────────────────────────────────────
  {
    id: "module.cannot_find",
    name: "Cannot find module",
    matcher: /Cannot find module '(?<module>[^']+)'|Module not found: Error: Can't resolve '(?<module2>[^']+)'/,
    extractor(match: RegExpMatchArray) {
      return {
        module: match.groups?.["module"] ?? match.groups?.["module2"] ?? "<unknown>",
      };
    },
    titleBuilder: ({ module }) => `Cannot find module "${module}"`,
    explanationBuilder: ({ module }) =>
      `Node.js (or your bundler) could not locate the module "${module}". ` +
      `This is either a missing npm dependency or an incorrect import path.`,
    causesBuilder: ({ module }) => [
      module.startsWith(".")
        ? `Relative path "${module}" is incorrect — the file may not exist at that location`
        : `"${module}" is not installed — run \`npm install ${module}\``,
      "A typo in the module name",
      "The package was removed from node_modules after a `node_modules` purge",
      "`node_modules` is out of sync — try `npm install` again",
    ],
    suggestionsBuilder: ({ module }) => [
      module.startsWith(".")
        ? `Double-check the relative path resolves to an existing file`
        : `Run: \`npm install ${module}\``,
      "Run `npm install` to restore node_modules from package.json",
      "Check the import path capitalisation — file systems may be case-sensitive",
      "Verify the package name on npmjs.com for the correct spelling",
    ],
    confidence: 0.97,
    tags: ["module", "import"],
  },

  // ─── require is not defined (ESM context) ───────────────────────────────
  {
    id: "module.require_not_defined",
    name: "require() in ESM context",
    // Use word boundary to avoid being beaten by the generic "X is not defined" pattern.
    // Confidence must exceed ref_error.not_defined (0.97) so this wins the ordering.
    matcher: /\brequire is not defined\b/,
    extractor: () => ({}),
    titleBuilder: () => `require() is not defined in ES module scope`,
    explanationBuilder: () =>
      "You used `require()` inside an ES module (`.mjs` or a file in a package with " +
      '`"type": "module"`). ES modules use `import` / `export` syntax — ' +
      "the CommonJS `require()` function is not available in this module context.",
    causesBuilder: () => [
      'Package has `"type": "module"` in package.json but uses CommonJS `require()`',
      "Using a `.mjs` file with CommonJS patterns",
    ],
    suggestionsBuilder: () => [
      "Replace `require('x')` with `import x from 'x'`",
      "Or use the createRequire helper: `import { createRequire } from 'module'; const require = createRequire(import.meta.url)`",
      'Remove `"type": "module"` from package.json if you want CommonJS',
    ],
    confidence: 0.99,
    tags: ["module", "esm", "cjs"],
  },

  // ─── Named export not found ──────────────────────────────────────────────
  {
    id: "module.named_export_missing",
    name: "Named export not found",
    matcher: /(?:does not provide an export named|has no export named) '(?<export>[^']+)'/,
    extractor(match: RegExpMatchArray) {
      return { export: match.groups?.["export"] ?? "<unknown>" };
    },
    titleBuilder: ({ export: exp }) => `Export "${exp}" not found in module`,
    explanationBuilder: ({ export: exp }) =>
      `The module you imported from does not export anything named "${exp}". ` +
      `It may have been renamed, removed, or is a default export.`,
    causesBuilder: ({ export: exp }) => [
      `"${exp}" was renamed in a newer version of the package`,
      `It is a default export — use \`import ${exp} from '…'\` instead`,
      "Typo in the export name",
    ],
    suggestionsBuilder: ({ export: exp }) => [
      `Check the package's changelog or source for the current export name`,
      `Try: \`import ${exp} from 'module'\` (default import)`,
      `Use your editor's auto-complete or check the package's TypeScript types`,
    ],
    confidence: 0.93,
    tags: ["module", "export"],
  },
];

export default moduleErrorPatterns;
