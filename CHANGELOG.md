# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-04-27

### Added

- **Package renamed** to `error-human-format`
- **37 Prisma error patterns** across all major Prisma error categories:
  - **P1xxx — Database server errors**: P1000 (auth), P1001 (unreachable), P1002 (timeout), P1003 (DB not found), P1008 (ops timeout), P1009 (DB exists), P1010 (access denied), P1011 (TLS/SSL), P1012 (schema validation), P1013 (invalid connection string), P1014 (table missing), P1015 (unsupported feature)
  - **P2xxx — Client query errors**: P2000 (value too long), P2001 (record not found), P2002 (unique constraint), P2003 (foreign key), P2004 (DB constraint), P2005 (invalid stored value), P2006 (invalid provided value), P2007 (data validation), P2008 (parse failed), P2009 (query validation), P2010 (raw query failed), P2011 (null constraint), P2012 (missing required value), P2013 (missing argument), P2014 (relation violation), P2015 (related record missing), P2016 (query interpretation), P2017 (records not connected), P2018 (required connected records), P2019 (input error), P2020 (value out of range), P2021 (table not found), P2022 (column not found), P2023 (inconsistent data), P2025 (record to update/delete not found), P2026 (unsupported feature), P2028 (transaction API error), P2034 (deadlock/conflict)
  - **P3xxx — Migrate errors**: P3000 (create DB failed), P3001 (destructive migration), P3002 (rollback), P3003 (format changed), P3005 (non-empty schema), P3006 (migration failed), P3008 (already applied), P3009 (failed migrations)
  - **Client errors**: PrismaClientValidationError, PrismaClientInitializationError, PrismaClientRustPanicError, client not generated, too many connections
- CLI binary renamed to `error-human-format`

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
- CLI tool with coloured output, `--json`, `--no-color`, `--stack` flags
- Stdin piping support (`cat error.log | error-human-format`)
- Express error-handling middleware (`errorHumanizerMiddleware()`)
- Full TypeScript types with strict mode
- CJS + ESM dual build output
- 86 tests (unit + integration) via Vitest
