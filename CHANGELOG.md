# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2024-01-01

### Added

- Core `humanize()` API accepting `Error`, `string`, or `{ message, stack }` input
- `registerPattern()` for custom plugin patterns
- 21 built-in patterns across 6 categories:
  - **TypeError** — null/undefined property access & mutation, not-a-function, not-iterable
  - **ReferenceError** — variable not defined, temporal dead zone
  - **SyntaxError / JSON** — unexpected token, JSON parse errors, strict-mode violations
  - **Network** — ECONNREFUSED/ETIMEDOUT/ENOTFOUND, HTTP 4xx/5xx, fetch failures
  - **Promises** — unhandled rejections, await-outside-async, Promise.all
  - **Modules** — cannot find module, require-in-ESM, missing named export
- Stack trace parser (V8 + SpiderMonkey formats)
- Relevant-frame detection (skips node internals and node_modules)
- Pluggable AI fallback interface (`aiFallback` option)
- CLI tool (`error-humanizer "<message>"`) with coloured output, `--json`, `--no-color`, `--stack` flags
- Stdin piping support (`cat error.log | error-humanizer`)
- Express error-handling middleware (`errorHumanizerMiddleware()`)
- Full TypeScript types with strict mode
- CJS + ESM dual build output
- 86 tests (unit + integration) via Vitest
