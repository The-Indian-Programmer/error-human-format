# Contributing to error-humanizer

Thank you for considering a contribution! Here's everything you need to get started.

---

## Table of Contents

- [Project Setup](#project-setup)
- [Adding a Pattern (Most Common Contribution)](#adding-a-pattern)
- [Adding a New Pattern File](#adding-a-new-pattern-file)
- [Writing Tests](#writing-tests)
- [Code Style](#code-style)
- [Submitting a Pull Request](#submitting-a-pull-request)

---

## Project Setup

```bash
git clone https://github.com/your-org/error-humanizer.git
cd error-humanizer
npm install

# Run tests
npm test

# Watch mode during development
npm run test:watch

# Type-check
npm run typecheck

# Build
npm run build
```

---

## Adding a Pattern

The fastest way to contribute is to add a pattern for an error you've personally encountered.

### Step 1 — Find the right pattern file

| Error category | File |
|----------------|------|
| `TypeError` | `src/patterns/typeErrors.ts` |
| `ReferenceError` | `src/patterns/referenceErrors.ts` |
| `SyntaxError` / JSON | `src/patterns/syntaxErrors.ts` |
| Network / HTTP / Axios / fetch | `src/patterns/networkErrors.ts` |
| Promises / async | `src/patterns/promiseErrors.ts` |
| Module / import / require | `src/patterns/moduleErrors.ts` |
| New category | Create `src/patterns/myCategory.ts` |

### Step 2 — Write the pattern

```ts
import type { ErrorPattern } from "../types/index.js";

const myPatterns: ErrorPattern[] = [
  {
    // Unique ID: "<category>.<specific_name>"
    id: "type_error.my_new_pattern",

    // Human-readable label (shown in debug mode)
    name: "My New Pattern",

    // Regex to detect this error. Use named capturing groups for dynamic content.
    matcher: /My error message with (?<thing>[^\s]+) in it/,

    // (Optional) Transform raw RegExpMatchArray into a plain object.
    // Only needed when you need logic beyond match.groups.
    extractor(match) {
      return { thing: match.groups?.thing ?? "<unknown>" };
    },

    // Build the short title from extracted groups
    titleBuilder: ({ thing }) => `Something failed because of "${thing}"`,

    // Build the plain-English explanation
    explanationBuilder: ({ thing }) =>
      `The error happened because "${thing}" was in an unexpected state. …`,

    // List of likely causes
    causesBuilder: ({ thing }) => [
      `"${thing}" was not initialised before use`,
      "A dependency returned an unexpected value",
    ],

    // Actionable fix steps
    suggestionsBuilder: ({ thing }) => [
      `Check the value of "${thing}" before this line`,
      "Add a guard clause: `if (!thing) return`",
    ],

    // How specific is this pattern? 0.9+ = very specific (few false positives)
    confidence: 0.92,

    // Tags for organisation (optional)
    tags: ["type-error", "initialisation"],
  },
];

export default myPatterns;
```

### Step 3 — Register the pattern file

Open `src/core/registry.ts` and add your import + spread:

```ts
import myPatterns from "../patterns/myCategory.js";

// Inside the constructor builtIn array:
const builtIn: ErrorPattern[] = [
  ...typeErrorPatterns,
  // ...
  ...myPatterns,   // ← add here
];
```

### Step 4 — Write a test

See [Writing Tests](#writing-tests) below.

---

## Adding a New Pattern File

If your patterns don't belong in any existing file:

1. Create `src/patterns/yourCategory.ts` following the template above.
2. Register it in `src/core/registry.ts`.
3. Create `tests/unit/yourCategory.test.ts` (or add to `tests/unit/patterns.test.ts`).

---

## Writing Tests

Every new pattern should have **at least two tests** in `tests/unit/patterns.test.ts`:

```ts
describe("findMatch — my category", () => {
  const registry = makeRegistry();

  it("matches the happy path", () => {
    const result = findMatch("My error message with foo in it", registry);

    expect(result).not.toBeNull();
    expect(result!.pattern.id).toBe("type_error.my_new_pattern");
    expect(result!.groups["thing"]).toBe("foo");
  });

  it("returns null for unrelated messages", () => {
    expect(findMatch("Something completely different", registry)).toBeNull();
  });
});
```

For end-to-end behaviour, add a test in `tests/integration/humanize.test.ts`:

```ts
it("generates correct explanation for my new pattern", async () => {
  const result = await humanize("My error message with bar in it");
  expect(result.confidence).toBeGreaterThan(0.8);
  expect(result.explanation).toContain("unexpected state");
});
```

Run the tests:

```bash
npm test
# or in watch mode:
npm run test:watch
```

---

## Code Style

- **TypeScript strict mode** — all code must pass `npm run typecheck`
- **No `any`** — use proper types or `unknown` + narrowing
- **Pattern builders are pure functions** — no side effects, no I/O
- **Confidence guidelines**:
  - `0.95 – 0.99` — extremely specific, almost no false positives (e.g. exact error string match)
  - `0.85 – 0.94` — specific but could theoretically match unrelated messages
  - `0.70 – 0.84` — moderate confidence, message is somewhat generic
  - `< 0.70` — broad catch-all (use sparingly)
- Keep `explanationBuilder` output to 2–4 sentences
- Keep `causesBuilder` and `suggestionsBuilder` to 3–6 items each

---

## Submitting a Pull Request

1. Fork the repository and create a feature branch: `git checkout -b feat/my-pattern`
2. Make your changes
3. Ensure all checks pass:
   ```bash
   npm run typecheck && npm test && npm run build
   ```
4. Open a PR with:
   - A clear title: `feat: add pattern for Prisma P2002 unique constraint violation`
   - The error message(s) your pattern covers
   - A before/after showing the old (generic fallback) vs new (pattern match) output

---

Thank you for helping make debugging easier for everyone! 🙏
