import { describe, it, expect } from "vitest";
import { findMatch } from "../../src/core/matcher.js";
import { PatternRegistry } from "../../src/core/registry.js";

function makeRegistry() {
  return new PatternRegistry();
}

// ── P1 — Database server errors ───────────────────────────────────────────────

describe("Prisma P1xxx — database server errors", () => {
  const registry = makeRegistry();

  it("P1000: matches authentication failure", () => {
    const r = findMatch(
      "Authentication failed against database server at `myhost.db.com`",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P1000");
    expect(r?.groups["host"]).toBe("myhost.db.com");
  });

  it("P1000: matches by error code alone", () => {
    const r = findMatch("P1000: Authentication failed", registry);
    expect(r?.pattern.id).toBe("prisma.P1000");
  });

  it("P1001: matches unreachable database", () => {
    const r = findMatch(
      "Can't reach database server at `localhost:5432`",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P1001");
    expect(r?.groups["host"]).toBe("localhost:5432");
  });

  it("P1001: matches by error code", () => {
    const r = findMatch("P1001: Database unreachable", registry);
    expect(r?.pattern.id).toBe("prisma.P1001");
  });

  it("P1002: matches connection timeout", () => {
    const r = findMatch(
      "The database server at `db.example.com` was reached but timed out",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P1002");
  });

  it("P1003: matches database does not exist", () => {
    const r = findMatch("Database `myapp_dev` does not exist", registry);
    expect(r?.pattern.id).toBe("prisma.P1003");
    expect(r?.groups["db"]).toBe("myapp_dev");
  });

  it("P1008: matches operations timed out", () => {
    const r = findMatch("Operations timed out after `5000ms`", registry);
    expect(r?.pattern.id).toBe("prisma.P1008");
    expect(r?.groups["ms"]).toBe("5000ms");
  });

  it("P1009: matches database already exists", () => {
    const r = findMatch("Database `myapp` already exists on the server", registry);
    expect(r?.pattern.id).toBe("prisma.P1009");
  });

  it("P1010: matches access denied", () => {
    const r = findMatch(
      "User `appuser` was denied access on the database `myapp`",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P1010");
    expect(r?.groups["user"]).toBe("appuser");
  });

  it("P1011: matches TLS error", () => {
    const r = findMatch("Error opening a TLS connection to the database", registry);
    expect(r?.pattern.id).toBe("prisma.P1011");
  });

  it("P1012: matches schema validation error", () => {
    const r = findMatch(
      "Field `id` is not valid in the current Prisma schema",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P1012");
  });

  it("P1013: matches invalid database string", () => {
    const r = findMatch("The provided database string is invalid", registry);
    expect(r?.pattern.id).toBe("prisma.P1013");
  });

  it("P1014: matches underlying model not found", () => {
    const r = findMatch(
      "The underlying `table` for model `User` does not exist",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P1014");
    expect(r?.groups["modelName"]).toBe("User");
  });

  it("P1015: matches unsupported DB feature", () => {
    const r = findMatch(
      "Your Prisma schema is using features that are not supported for the version of the database",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P1015");
  });
});

// ── P2 — Query errors ─────────────────────────────────────────────────────────

describe("Prisma P2xxx — client query errors", () => {
  const registry = makeRegistry();

  it("P2000: matches value too long", () => {
    const r = findMatch(
      "The provided value for the column is too long for the column's type. Column: `email`",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2000");
    expect(r?.groups["col"]).toBe("email");
  });

  it("P2001: matches record not found in where", () => {
    const r = findMatch(
      "The record searched for in the where condition (`User.(id)` = `999`) does not exist",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2001");
  });

  it("P2002: matches unique constraint on single field", () => {
    const r = findMatch(
      "Unique constraint failed on the fields: (`email`)",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2002");
    expect(r?.groups["fields"]).toBe("email");
  });

  it("P2002: matches unique constraint on composite fields", () => {
    const r = findMatch(
      "Unique constraint failed on the fields: (`userId`, `postId`)",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2002");
    expect(r?.groups["fields"]).toBe("userId, postId");
  });

  it("P2002: matches unique constraint via constraint name", () => {
    const r = findMatch(
      "Unique constraint failed on the constraint: `User_email_key`",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2002");
  });

  it("P2003: matches foreign key constraint", () => {
    const r = findMatch(
      "Foreign key constraint failed on the field: `authorId`",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2003");
    expect(r?.groups["field"]).toBe("authorId");
  });

  it("P2004: matches generic database constraint", () => {
    const r = findMatch("A constraint failed on the database", registry);
    expect(r?.pattern.id).toBe("prisma.P2004");
  });

  it("P2005: matches invalid field value stored in DB", () => {
    const r = findMatch(
      "The value `abc` stored in the database for the field `age` is invalid for the field's type",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2005");
    expect(r?.groups["field"]).toBe("age");
    expect(r?.groups["value"]).toBe("abc");
  });

  it("P2006: matches invalid provided value for field", () => {
    const r = findMatch(
      "The provided value `null` for `User` field `name` is not valid",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2006");
    expect(r?.groups["field"]).toBe("name");
    expect(r?.groups["model"]).toBe("User");
  });

  it("P2007: matches data validation error", () => {
    const r = findMatch("Data validation error: invalid input on field x", registry);
    expect(r?.pattern.id).toBe("prisma.P2007");
  });

  it("P2008: matches failed to parse query", () => {
    const r = findMatch("Failed to parse the query at character 42", registry);
    expect(r?.pattern.id).toBe("prisma.P2008");
  });

  it("P2009: matches failed to validate query", () => {
    const r = findMatch("Failed to validate the query: unknown field", registry);
    expect(r?.pattern.id).toBe("prisma.P2009");
  });

  it("P2010: matches raw query failure", () => {
    const r = findMatch(
      "Raw query failed. Code: `42703`. Message: `column \"foo\" does not exist`",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2010");
    expect(r?.groups["code"]).toBe("42703");
  });

  it("P2011: matches null constraint violation", () => {
    const r = findMatch(
      "Null constraint violation on the fields: (`name`)",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2011");
    expect(r?.groups["fields"]).toBe("name");
  });

  it("P2012: matches missing required value at path", () => {
    const r = findMatch(
      "Missing a required value at `Mutation.createUser.data.email`",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2012");
    expect(r?.groups["path"]).toBe("Mutation.createUser.data.email");
  });

  it("P2013: matches missing required argument", () => {
    const r = findMatch(
      "Missing the required argument `data` for field `createUser` on `Mutation`",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2013");
    expect(r?.groups["arg"]).toBe("data");
    expect(r?.groups["model"]).toBe("Mutation");
  });

  it("P2014: matches relation violation", () => {
    const r = findMatch(
      "The change you are trying to make would violate the required relation 'Post_authorId_fkey' between the `User` and `Post` models",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2014");
    expect(r?.groups["modelA"]).toBe("User");
    expect(r?.groups["modelB"]).toBe("Post");
  });

  it("P2015: matches related record not found", () => {
    const r = findMatch("A related record could not be found", registry);
    expect(r?.pattern.id).toBe("prisma.P2015");
  });

  it("P2016: matches query interpretation error", () => {
    const r = findMatch("Query interpretation error: unexpected input", registry);
    expect(r?.pattern.id).toBe("prisma.P2016");
  });

  it("P2017: matches records not connected", () => {
    const r = findMatch(
      "The records for relation `Post_authorId_fkey` between the `User` and `Post` models are not connected",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2017");
    expect(r?.groups["modelA"]).toBe("User");
    expect(r?.groups["modelB"]).toBe("Post");
  });

  it("P2018: matches required connected records not found", () => {
    const r = findMatch("The required connected records were not found", registry);
    expect(r?.pattern.id).toBe("prisma.P2018");
  });

  it("P2019: matches input error", () => {
    const r = findMatch("Input error: conflicting operations on relation", registry);
    expect(r?.pattern.id).toBe("prisma.P2019");
  });

  it("P2020: matches value out of range", () => {
    const r = findMatch(
      "Value out of range for the type. Column: `age`",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2020");
    expect(r?.groups["col"]).toBe("age");
  });

  it("P2021: matches table does not exist", () => {
    const r = findMatch(
      "The table `public.User` does not exist in the current database",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2021");
    expect(r?.groups["table"]).toBe("public.User");
  });

  it("P2022: matches column does not exist", () => {
    const r = findMatch(
      "The column `User.updatedAt` does not exist in the current database",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2022");
    expect(r?.groups["column"]).toBe("User.updatedAt");
  });

  it("P2023: matches inconsistent column data", () => {
    const r = findMatch("Inconsistent column data: expected Int, got String", registry);
    expect(r?.pattern.id).toBe("prisma.P2023");
  });

  it("P2025: matches required record not found (most common)", () => {
    const r = findMatch(
      "An operation failed because it depends on one or more records that were required but not found",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2025");
  });

  it("P2026: matches unsupported feature in query", () => {
    const r = findMatch(
      "The current database provider doesn't support a feature that the query used",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2026");
  });

  it("P2028: matches transaction API error", () => {
    const r = findMatch("Transaction API error: transaction timed out", registry);
    expect(r?.pattern.id).toBe("prisma.P2028");
  });

  it("P2034: matches deadlock / write conflict", () => {
    const r = findMatch(
      "Transaction failed due to a write conflict or a deadlock. Please retry your transaction",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P2034");
  });
});

// ── P3 — Migrate errors ───────────────────────────────────────────────────────

describe("Prisma P3xxx — migrate errors", () => {
  const registry = makeRegistry();

  it("P3000: matches failed to create database", () => {
    const r = findMatch("Failed to create database: permission denied", registry);
    expect(r?.pattern.id).toBe("prisma.P3000");
  });

  it("P3001: matches destructive migration warning", () => {
    const r = findMatch(
      "Migration possible with destructive changes and possible data loss",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P3001");
  });

  it("P3002: matches rolled back migration", () => {
    const r = findMatch("The attempted migration was rolled back", registry);
    expect(r?.pattern.id).toBe("prisma.P3002");
  });

  it("P3003: matches old migration format", () => {
    const r = findMatch(
      "The format of migrations changed, the saved migrations are no longer valid",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P3003");
  });

  it("P3005: matches non-empty database schema", () => {
    const r = findMatch(
      "The database schema is not empty at schema.prisma",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P3005");
  });

  it("P3006: matches migration failed to apply cleanly", () => {
    const r = findMatch(
      "Migration `20240101_init` failed to apply cleanly to the shadow database",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P3006");
    expect(r?.groups["migration"]).toBe("20240101_init");
  });

  it("P3008: matches migration already applied", () => {
    const r = findMatch(
      "The migration `20240101_add_users` is already recorded as applied in the database",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P3008");
    expect(r?.groups["migration"]).toBe("20240101_add_users");
  });

  it("P3009: matches failed migrations found", () => {
    const r = findMatch(
      "migrate found failed migrations in the target database, new migrations will not be applied",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.P3009");
  });
});

// ── Client-level errors ────────────────────────────────────────────────────────

describe("Prisma client-level errors", () => {
  const registry = makeRegistry();

  it("matches PrismaClient not generated", () => {
    const r = findMatch("Cannot find module '.prisma/client'", registry);
    expect(r?.pattern.id).toBe("prisma.client_not_generated");
  });

  it("matches PrismaClient unable to run in browser", () => {
    const r = findMatch(
      "PrismaClient is unable to run in this browser environment",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.client_not_generated");
  });

  it("matches PrismaClientValidationError — missing argument", () => {
    const r = findMatch("Argument `where` is missing", registry);
    expect(r?.pattern.id).toBe("prisma.validation_error");
    expect(r?.groups["arg"]).toBe("where");
  });

  it("matches PrismaClientValidationError — unknown argument", () => {
    const r = findMatch(
      "Unknown argument `typoField`. Did you mean `titleField`?",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.validation_error");
  });

  it("matches PrismaClientRustPanicError", () => {
    const r = findMatch(
      "PrismaClientRustPanicError: The query engine process died with signal SIGABRT",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.rust_panic");
  });

  it("matches Rust panic keyword", () => {
    const r = findMatch("Rust panic in query engine thread", registry);
    expect(r?.pattern.id).toBe("prisma.rust_panic");
  });

  it("matches PrismaClientInitializationError", () => {
    const r = findMatch(
      "PrismaClientInitializationError: Could not connect to the database",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.init_error");
  });

  it("matches too many connections", () => {
    const r = findMatch(
      "too many connections for database 'myapp'",
      registry
    );
    expect(r?.pattern.id).toBe("prisma.too_many_connections");
  });

  it("matches connection pool exhausted", () => {
    const r = findMatch("Timed out fetching a new connection from the connection pool", registry);
    expect(r?.pattern.id).toBe("prisma.too_many_connections");
  });
});

// ── Builder output quality ────────────────────────────────────────────────────

describe("Prisma pattern builder output quality", () => {
  const registry = makeRegistry();

  it("P2002 builder produces correct title, causes, and suggestions", () => {
    const r = findMatch("Unique constraint failed on the fields: (`email`)", registry);
    expect(r).not.toBeNull();

    const groups = r!.groups;
    const title = r!.pattern.titleBuilder(groups);
    const explanation = r!.pattern.explanationBuilder(groups);
    const causes = r!.pattern.causesBuilder(groups);
    const suggestions = r!.pattern.suggestionsBuilder(groups);

    expect(title).toContain("email");
    expect(explanation).toContain("email");
    expect(causes.length).toBeGreaterThan(2);
    expect(suggestions.some(s => s.includes("upsert"))).toBe(true);
    expect(suggestions.some(s => s.includes("P2002"))).toBe(true);
  });

  it("P2025 builder produces actionable suggestions", () => {
    const r = findMatch(
      "An operation failed because it depends on one or more records that were required but not found",
      registry
    );
    const suggestions = r!.pattern.suggestionsBuilder(r!.groups);
    expect(suggestions.some(s => s.includes("findUnique"))).toBe(true);
    expect(suggestions.some(s => s.includes("P2025"))).toBe(true);
  });

  it("P2003 builder names the foreign key field in suggestions", () => {
    const r = findMatch(
      "Foreign key constraint failed on the field: `authorId`",
      registry
    );
    const suggestions = r!.pattern.suggestionsBuilder(r!.groups);
    expect(suggestions.some(s => s.includes("authorId"))).toBe(true);
  });

  it("P1001 builder includes the host in suggestions", () => {
    const r = findMatch("Can't reach database server at `db.prod.internal:5432`", registry);
    const suggestions = r!.pattern.suggestionsBuilder(r!.groups);
    expect(suggestions.some(s => s.includes("db.prod.internal:5432"))).toBe(true);
  });

  it("P2011 builder names the null-violating field in suggestions", () => {
    const r = findMatch("Null constraint violation on the fields: (`title`)", registry);
    const suggestions = r!.pattern.suggestionsBuilder(r!.groups);
    expect(suggestions.some(s => s.includes("title"))).toBe(true);
  });

  it("too_many_connections builder mentions singleton pattern", () => {
    const r = findMatch("too many connections for role 'appuser'", registry);
    const suggestions = r!.pattern.suggestionsBuilder(r!.groups);
    expect(suggestions.some(s => s.toLowerCase().includes("singleton"))).toBe(true);
  });

  it("P2034 builder mentions retry logic", () => {
    const r = findMatch(
      "Transaction failed due to a write conflict or a deadlock",
      registry
    );
    const suggestions = r!.pattern.suggestionsBuilder(r!.groups);
    expect(suggestions.some(s => s.toLowerCase().includes("retry"))).toBe(true);
  });

  it("all Prisma patterns have non-empty causes and suggestions", () => {
    const allPatterns = registry.getSorted().filter(p => p.tags?.includes("prisma"));
    for (const pattern of allPatterns) {
      const groups: Record<string, string> = {};
      const causes = pattern.causesBuilder(groups);
      const suggestions = pattern.suggestionsBuilder(groups);
      expect(causes.length, `${pattern.id} should have causes`).toBeGreaterThan(0);
      expect(suggestions.length, `${pattern.id} should have suggestions`).toBeGreaterThan(0);
    }
  });

  it("all Prisma patterns have confidence >= 0.85", () => {
    const prismaPatterns = registry.getSorted().filter(p => p.tags?.includes("prisma"));
    for (const p of prismaPatterns) {
      expect(p.confidence, `${p.id} confidence too low`).toBeGreaterThanOrEqual(0.85);
    }
  });
});

// ── Registry state ────────────────────────────────────────────────────────────

describe("Registry — Prisma patterns registered", () => {
  it("has all expected Prisma pattern IDs registered", () => {
    const registry = makeRegistry();
    const expectedIds = [
      "prisma.P1000", "prisma.P1001", "prisma.P1002", "prisma.P1003",
      "prisma.P1008", "prisma.P1009", "prisma.P1010", "prisma.P1011",
      "prisma.P1012", "prisma.P1013", "prisma.P1014", "prisma.P1015",
      "prisma.P2000", "prisma.P2001", "prisma.P2002", "prisma.P2003",
      "prisma.P2004", "prisma.P2005", "prisma.P2006", "prisma.P2007",
      "prisma.P2008", "prisma.P2009", "prisma.P2010", "prisma.P2011",
      "prisma.P2012", "prisma.P2013", "prisma.P2014", "prisma.P2015",
      "prisma.P2016", "prisma.P2017", "prisma.P2018", "prisma.P2019",
      "prisma.P2020", "prisma.P2021", "prisma.P2022", "prisma.P2023",
      "prisma.P2025", "prisma.P2026", "prisma.P2028", "prisma.P2034",
      "prisma.P3000", "prisma.P3001", "prisma.P3002", "prisma.P3003",
      "prisma.P3005", "prisma.P3006", "prisma.P3008", "prisma.P3009",
      "prisma.client_not_generated", "prisma.validation_error",
      "prisma.rust_panic", "prisma.init_error", "prisma.too_many_connections",
    ];
    for (const id of expectedIds) {
      expect(registry.get(id), `Expected pattern "${id}" to be registered`).toBeDefined();
    }
  });

  it("total registry size increased by Prisma patterns", () => {
    const registry = makeRegistry();
    // 21 original + 37 Prisma = 58+ total
    expect(registry.size).toBeGreaterThanOrEqual(53);
  });
});
