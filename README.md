# error-humanizer

> Intelligent error explanation engine for JavaScript and Node.js.  
> Converts raw errors into human-readable explanations with actionable debugging suggestions.

[![npm version](https://img.shields.io/npm/v/error-humanizer.svg)](https://www.npmjs.com/package/error-humanizer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

---

## Why?

Raw JavaScript errors tell you *what* broke. `error-humanizer` tells you *why* it likely broke and *how* to fix it — instantly, without leaving your terminal or codebase.

```
❌  Accessed property "id" on undefined

👉  Explanation
    You tried to read the property "id" from a value that is undefined.
    This usually means a variable was never assigned, an async operation
    hadn't finished yet, or an API returned undefined unexpectedly.

🔍  Possible Causes
    • A variable was declared but never initialised (it stayed undefined)
    • An asynchronous operation completed but the result wasn't awaited
    • An API call or function returned an unexpected null/undefined

💡  Suggestions
    1. Add a null-check before accessing: `if (obj != null) { obj.id … }`
    2. Use optional chaining: `obj?.id`
    3. Use nullish coalescing as a fallback: `(obj ?? defaultValue).id`
    4. Verify the variable is properly initialised before this line

📍  Location
    /app/src/handler.ts:42:8 (handleRequest)

📊  Confidence: 97%
```

---

## Installation

```bash
npm install error-humanizer
# or
pnpm add error-humanizer
# or
yarn add error-humanizer
```

For the CLI tool, install globally:

```bash
npm install -g error-humanizer
```

---

## Quick Start

### Programmatic API

```ts
import { humanize } from 'error-humanizer';

try {
  // your code
} catch (err) {
  const result = await humanize(err);

  console.log(result.title);          // "Accessed property "id" on undefined"
  console.log(result.explanation);    // Plain-English explanation
  console.log(result.possibleCauses); // string[]
  console.log(result.suggestions);    // string[]
  console.log(result.confidence);     // 0–1 score
  console.log(result.location);       // { fileName, lineNumber, … }
}
```

### CLI

```bash
# Analyse an error message
error-humanizer "Cannot read properties of undefined (reading 'id')"

# Pipe a stack trace
cat error.log | error-humanizer

# Output raw JSON
error-humanizer "myVar is not defined" --json

# Include the stack trace in output
error-humanizer "ECONNREFUSED 127.0.0.1:5432" --stack

# Disable colours (e.g. for CI)
error-humanizer "Unexpected end of JSON input" --no-color
```

---

## API Reference

### `humanize(input, options?)`

Converts any error into a structured `HumanizedError` report.

```ts
import { humanize } from 'error-humanizer';

const result = await humanize(input, options);
```

**Input** — accepts any of:

| Type | Example |
|------|---------|
| `Error` (or subclass) | `new TypeError("…")` |
| `string` | `"Cannot read properties of undefined…"` |
| Stack trace string | Full multi-line stack trace |
| `{ message, stack? }` | Plain object |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeStack` | `boolean` | `false` | Attach raw stack trace to the result |
| `verbose` | `boolean` | `false` | Log normalisation/match decisions |
| `debugMode` | `boolean` | `false` | Print internal pattern matching details |
| `color` | `boolean` | `false` | Apply ANSI colour codes to string fields |
| `aiFallback` | `AiFallbackHandler` | — | Called when no pattern matches |

**Return type — `HumanizedError`:**

```ts
interface HumanizedError {
  title:          string;       // Short, descriptive title
  explanation:    string;       // Plain-English explanation
  possibleCauses: string[];     // List of likely root causes
  suggestions:    string[];     // Actionable fix steps
  confidence:     number;       // 0–1 match confidence
  location?:      StackFrame;   // Parsed stack location
  errorType?:     string;       // e.g. "TypeError"
  stack?:         string;       // Raw stack (when includeStack: true)
}
```

---

### `registerPattern(pattern)`

Register a custom (or override a built-in) pattern.

```ts
import { registerPattern } from 'error-humanizer';

registerPattern({
  id: 'my_app.db_connection',
  name: 'Database Connection Error',
  matcher: /SQLITE_CANTOPEN: unable to open database file (?<file>.+)/,
  extractor: (match) => ({ file: match.groups?.file ?? '<unknown>' }),
  titleBuilder:       ({ file }) => `Cannot open SQLite database: ${file}`,
  explanationBuilder: ({ file }) =>
    `SQLite could not open the database file at "${file}". ` +
    `The file may not exist, or the process lacks read/write permissions.`,
  causesBuilder: () => [
    'The database file path is wrong',
    'The directory does not exist',
    'Insufficient file system permissions',
  ],
  suggestionsBuilder: ({ file }) => [
    `Verify the path exists: \`ls -la ${file}\``,
    'Check process permissions: `ls -l $(dirname <file>)`',
    'Create the directory if missing: `mkdir -p $(dirname <file>)`',
  ],
  confidence: 0.96,
  tags: ['database', 'sqlite'],
});
```

---

### `registry`

Direct access to the global pattern registry (for advanced use):

```ts
import { registry } from 'error-humanizer';

console.log(registry.size);            // number of registered patterns
const pattern = registry.get('type_error.cannot_read_props');
const all     = registry.getSorted();  // sorted by confidence desc
```

---

### Stack Trace Utilities

```ts
import {
  parseStackTrace,
  getMostRelevantFrame,
  formatFrame,
} from 'error-humanizer';

const frames  = parseStackTrace(err.stack ?? '');
const topFrame = getMostRelevantFrame(frames);
const label    = formatFrame(topFrame!); // "/app/src/handler.ts:42:8 (handleRequest)"
```

---

## Express Middleware

```ts
import express from 'express';
import { errorHumanizerMiddleware } from 'error-humanizer/middleware';

const app = express();

app.get('/example', (req, res) => {
  throw new TypeError("Cannot read properties of undefined (reading 'userId')");
});

// Must be registered AFTER your routes, with 4 parameters
app.use(errorHumanizerMiddleware({
  exposeToClient: true,   // send humanized JSON to client
  includeStack: false,    // don't leak internals
}));

app.listen(3000);
```

**Response shape:**

```json
{
  "error": {
    "title": "Accessed property \"userId\" on undefined",
    "explanation": "You tried to read…",
    "suggestions": ["Add a null-check…", "Use optional chaining…"],
    "confidence": 0.97
  }
}
```

**Custom logger and response transformer:**

```ts
app.use(errorHumanizerMiddleware({
  exposeToClient: true,
  logger: (result, req) => {
    myMonitoringService.track({ title: result.title, path: req.path });
  },
  responseTransformer: (result, req) => ({
    success: false,
    requestId: req.headers['x-request-id'],
    error: result,
  }),
}));
```

---

## AI Fallback

When no built-in pattern matches, you can plug in any AI provider:

```ts
import { humanize } from 'error-humanizer';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const result = await humanize(err, {
  aiFallback: async (message, errorType) => {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Explain this ${errorType ?? 'JavaScript'} error to a developer:
"${message}"
Respond with JSON: { title, explanation, possibleCauses: string[], suggestions: string[], confidence: number }`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(text);
  },
});
```

The fallback is **never a hard dependency** — import it only when you need it.

---

## Built-in Error Coverage

| Category | Patterns |
|----------|----------|
| **TypeError** | `undefined`/`null` property access & mutation, not-a-function, not-iterable, null-to-object |
| **ReferenceError** | Variable not defined, Temporal Dead Zone (let/const) |
| **SyntaxError / JSON** | Unexpected token, end of JSON input, invalid chars after JSON, strict-mode violations |
| **Network** | ECONNREFUSED, ECONNRESET, ETIMEDOUT, ENOTFOUND, HTTP 4xx/5xx, fetch failures, invalid JSON responses |
| **Promises** | Unhandled rejections, `await` outside async, `Promise.all` failures |
| **Modules** | Cannot find module, `require` in ESM, missing named exports |

---

## Plugin Architecture

Every pattern is an `ErrorPattern` object stored in `src/patterns/`. Adding support for a new library is a single file:

```ts
// src/patterns/prismaErrors.ts
import type { ErrorPattern } from '../types/index.js';

const prismaErrorPatterns: ErrorPattern[] = [
  {
    id: 'prisma.record_not_found',
    name: 'Prisma Record Not Found',
    matcher: /An operation failed because it depends on one or more records that were required but not found/,
    // ...
  },
];

export default prismaErrorPatterns;
```

Then add it to `src/core/registry.ts`:

```ts
import prismaErrorPatterns from '../patterns/prismaErrors.js';
// add to the builtIn array
```

---

## Performance

- **Pattern matching is O(n)** on the number of patterns, with early exit on first match.
- Patterns are sorted once by confidence and cached — subsequent calls hit the cache.
- No heavy runtime dependencies (only `chalk` and `commander` for the CLI).
- Zero async work unless an AI fallback is configured.

---

## Project Structure

```
error-humanizer/
├── src/
│   ├── core/
│   │   ├── humanizer.ts      # humanize() + registerPattern()
│   │   ├── matcher.ts        # Pattern matching engine
│   │   └── registry.ts       # PatternRegistry (singleton + class)
│   ├── patterns/
│   │   ├── typeErrors.ts     # TypeError patterns
│   │   ├── referenceErrors.ts
│   │   ├── syntaxErrors.ts
│   │   ├── networkErrors.ts
│   │   ├── promiseErrors.ts
│   │   └── moduleErrors.ts
│   ├── utils/
│   │   ├── stackParser.ts    # Stack trace parsing
│   │   └── normalizer.ts     # Input normalisation
│   ├── cli/
│   │   ├── index.ts          # CLI entry point (Commander)
│   │   └── formatter.ts      # Coloured output
│   ├── middleware/
│   │   └── index.ts          # Express error middleware
│   ├── types/
│   │   └── index.ts          # All exported TypeScript types
│   └── index.ts              # Public package entry point
├── tests/
│   ├── unit/
│   │   ├── stackParser.test.ts
│   │   ├── normalizer.test.ts
│   │   ├── patterns.test.ts
│   │   └── formatter.test.ts
│   └── integration/
│       └── humanize.test.ts
├── dist/                     # Compiled output (CJS + ESM + .d.ts)
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Type check
npm run typecheck

# Build
npm run build
```

---

## Contributing

Contributions are welcome! The easiest way to contribute is to **add a new pattern** for an error you encounter:

1. Identify the error message and its variants.
2. Create (or add to) the relevant file in `src/patterns/`.
3. Write a matching test in `tests/unit/patterns.test.ts`.
4. Open a PR — that's it!

Please ensure:
- All tests pass (`npm test`)
- TypeScript compiles cleanly (`npm run typecheck`)
- Patterns have a realistic `confidence` value (high = very specific match)

---

## VS Code Extension (Architecture Note)

`error-humanizer` is designed to be extension-ready. The core `humanize()` function has no Node.js-specific dependencies and can run in a VS Code extension host. A VS Code extension can:

1. Subscribe to the language server's diagnostic events.
2. Pass error messages to `humanize()`.
3. Show the structured output in a hover tooltip or side panel.

---

## License

MIT © error-humanizer contributors
