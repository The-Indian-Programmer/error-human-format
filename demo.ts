/**
 * demo.ts — end-to-end showcase of error-humanizer
 *
 * Run with:  npx ts-node --esm demo.ts
 * Or after build:  node dist/demo.js
 *
 * This file intentionally uses the public API surface exactly as a
 * downstream consumer would, making it a living integration test.
 */

import { humanize, registerPattern } from "./src/index.js";
import { formatForCli } from "./src/cli/formatter.js";
import type { HumanizedError } from "./src/types/index.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USE_COLOR = process.stdout.isTTY;

function print(result: HumanizedError): void {
  process.stdout.write(formatForCli(result, USE_COLOR));
}

function section(title: string): void {
  const bar = "═".repeat(60);
  console.log(`\n${bar}`);
  console.log(`  ${title}`);
  console.log(`${bar}`);
}

// ─── Demo cases ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // 1. TypeError — null property access
  section("1. TypeError: null property access (string input)");
  print(
    await humanize(
      "TypeError: Cannot read properties of undefined (reading 'userId')"
    )
  );

  // 2. TypeError — real Error object with stack
  section("2. TypeError: real Error object (with location extraction)");
  const typeErr = new TypeError("myService.init is not a function");
  print(await humanize(typeErr, { includeStack: true }));

  // 3. ReferenceError — variable not defined
  section("3. ReferenceError: variable not defined");
  print(await humanize(new ReferenceError("configMap is not defined")));

  // 4. ReferenceError — temporal dead zone
  section("4. ReferenceError: temporal dead zone (let/const before init)");
  print(
    await humanize("Cannot access 'dbConnection' before initialization")
  );

  // 5. SyntaxError — unexpected end of JSON
  section("5. SyntaxError: Unexpected end of JSON input");
  print(await humanize(new SyntaxError("Unexpected end of JSON input")));

  // 6. Network — ECONNREFUSED
  section("6. Network: ECONNREFUSED (server not running)");
  print(
    await humanize(
      "connect ECONNREFUSED 127.0.0.1:5432"
    )
  );

  // 7. Network — HTTP 401
  section("7. Network: HTTP 401 Unauthorized");
  print(await humanize("Request failed with status code 401"));

  // 8. Network — HTTP 429 rate limit
  section("8. Network: HTTP 429 Too Many Requests");
  print(await humanize("Request failed with status code 429"));

  // 9. Network — fetch failed
  section("9. Network: Failed to fetch (browser/Node)");
  print(await humanize("Failed to fetch"));

  // 10. Promise — unhandled rejection
  section("10. Promise: Unhandled rejection");
  print(
    await humanize(
      "UnhandledPromiseRejectionWarning: Error: database connection lost"
    )
  );

  // 11. Promise — await outside async
  section("11. Promise: await used outside async function");
  print(await humanize("await is only valid in async function"));

  // 12. Module — cannot find
  section("12. Module: Cannot find module");
  print(await humanize("Cannot find module 'pg'"));

  // 13. Module — require in ESM
  section("13. Module: require() in ESM context");
  print(await humanize("require is not defined"));

  // 14. Full stack trace string with location extraction
  section("14. Full stack trace string → location extracted");
  const stackTrace = `TypeError: Cannot read properties of null (reading 'email')
    at getUserEmail (/app/src/services/userService.ts:87:22)
    at async handleProfileRequest (/app/src/controllers/profile.ts:34:18)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:149:13)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;

  print(await humanize(stackTrace));

  // 15. Custom plugin pattern via registerPattern()
  section("15. Plugin: registerPattern() for Prisma P2002");
  registerPattern({
    id: "prisma.unique_constraint",
    name: "Prisma Unique Constraint Violation",
    matcher:
      /Unique constraint failed on the (?:fields|constraint): \(`?(?<field>[^`)]+)`?\)/,
    extractor(match) {
      return { field: match.groups?.["field"] ?? "<unknown>" };
    },
    titleBuilder: ({ field }) =>
      `Unique constraint violation on field "${field}"`,
    explanationBuilder: ({ field }) =>
      `A record with the same value for "${field}" already exists in the database. ` +
      `Prisma enforces the unique constraint defined in your schema.`,
    causesBuilder: ({ field }) => [
      `Duplicate value submitted for the unique field "${field}"`,
      "A race condition between two concurrent create operations",
      "Seed data or migrations inserted a conflicting record",
    ],
    suggestionsBuilder: ({ field }) => [
      `Check for an existing record before inserting: \`prisma.user.findUnique({ where: { ${field}: value } })\``,
      "Use `upsert` instead of `create` to handle the conflict gracefully",
      "Add application-level deduplication before the database call",
    ],
    confidence: 0.97,
    tags: ["database", "prisma", "constraint"],
  });

  print(
    await humanize(
      "Unique constraint failed on the fields: (`email`)"
    )
  );

  // 16. AI fallback — mock implementation
  section("16. AI Fallback: mock provider (no pattern match)");
  const mockAiFallback = async (message: string): Promise<HumanizedError> => {
    // Simulates calling an external AI API
    await new Promise((r) => setTimeout(r, 10)); // tiny fake latency
    return {
      title: `[AI] Unrecognised error`,
      explanation: `The AI analysed "${message.slice(0, 60)}…" and found no matching pattern. This looks like an application-specific error.`,
      possibleCauses: [
        "Application-specific business logic failure",
        "A dependency version mismatch",
      ],
      suggestions: [
        "Search the error message in the library's GitHub issues",
        "Add detailed logging around the failing code path",
        "Check recent commits that modified the related module",
      ],
      confidence: 0.55,
    };
  };

  print(
    await humanize("EAPP_CUSTOM_INTERNAL_FAILURE: subsystem 7 unresponsive", {
      aiFallback: mockAiFallback,
    })
  );

  // 17. JSON output mode (what --json flag produces)
  section("17. Structured JSON output (for tooling integrations)");
  const jsonResult = await humanize(
    "Cannot find module './config/database'",
    { includeStack: false }
  );
  console.log(JSON.stringify(jsonResult, null, 2));

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("  ✅  Demo complete — all 17 scenarios ran successfully");
  console.log("═".repeat(60) + "\n");
}

main().catch((err) => {
  console.error("Demo failed:", err);
  process.exit(1);
});
