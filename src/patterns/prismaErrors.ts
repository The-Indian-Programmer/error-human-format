import type { ErrorPattern } from "../types/index.js";

/**
 * Prisma error patterns — covers all commonly encountered Prisma Client,
 * Prisma Migrate, and Prisma Engine errors.
 *
 * Prisma error codes reference:
 *   https://www.prisma.io/docs/reference/api-reference/error-reference
 *
 * Categories:
 *   P1xxx — Database server errors
 *   P2xxx — Prisma Client (query) errors
 *   P3xxx — Migrate errors
 *   P4xxx — Introspect errors
 *   P5xxx — Data Proxy errors
 *   PrismaClientInitializationError
 *   PrismaClientKnownRequestError
 *   PrismaClientUnknownRequestError
 *   PrismaClientValidationError
 *   PrismaClientRustPanicError
 */

const prismaErrorPatterns: ErrorPattern[] = [

  // ═══════════════════════════════════════════════════════════
  // P1 — DATABASE SERVER ERRORS
  // ═══════════════════════════════════════════════════════════

  {
    id: "prisma.P1000",
    name: "Prisma P1000: Authentication failed",
    matcher: /P1000|Authentication failed against database server at `?(?<host>[^`\s,]+)?/i,
    extractor(match: RegExpMatchArray) {
      return { host: match.groups?.["host"] ?? "<unknown host>" };
    },
    titleBuilder: ({ host }) =>
      `Prisma P1000: Database authentication failed${host !== "<unknown host>" ? ` at ${host}` : ""}`,
    explanationBuilder: () =>
      "Prisma could not authenticate with the database server. " +
      "The provided username or password in the connection URL is incorrect.",
    causesBuilder: () => [
      "Wrong username or password in the DATABASE_URL environment variable",
      "The database user does not exist",
      "The user's password was recently changed and the env var wasn't updated",
      "Using a connection string from a different environment (staging vs prod)",
    ],
    suggestionsBuilder: () => [
      "Verify your DATABASE_URL is correctly set: `echo $DATABASE_URL`",
      "Test the credentials directly: `psql \"$DATABASE_URL\"` (or mysql equivalent)",
      "Confirm the DB user exists and has the correct password in your DB console",
      "Regenerate and update credentials if using a managed DB (e.g. PlanetScale, Supabase, Neon)",
    ],
    confidence: 0.97,
    tags: ["prisma", "database", "auth", "P1000"],
  },

  {
    id: "prisma.P1001",
    name: "Prisma P1001: Cannot reach database server",
    matcher: /P1001|Can't reach database server at `?(?<host>[^`\s]+)?/i,
    extractor(match: RegExpMatchArray) {
      return { host: match.groups?.["host"] ?? "<unknown>" };
    },
    titleBuilder: ({ host }) =>
      `Prisma P1001: Cannot reach database server${host !== "<unknown>" ? ` at "${host}"` : ""}`,
    explanationBuilder: ({ host }) =>
      `Prisma cannot establish a TCP connection to the database server` +
      `${host !== "<unknown>" ? ` at "${host}"` : ""}. ` +
      `The server is either not running, unreachable over the network, or the host/port is wrong.`,
    causesBuilder: () => [
      "The database server is not running",
      "Wrong host or port in the DATABASE_URL",
      "A firewall or security group is blocking port 5432/3306",
      "The database container is not started (Docker Compose scenario)",
      "VPN or network tunnel is not active",
    ],
    suggestionsBuilder: ({ host }) => [
      `Test connectivity: \`nc -zv ${host !== "<unknown>" ? host : "<host> <port>"}\``,
      "Check the database service status: `docker ps` or `systemctl status postgresql`",
      "Verify DATABASE_URL host and port are correct",
      "Ensure database port is open in firewall / security group rules",
      "If using Docker Compose, run `docker-compose up -d db` first",
    ],
    confidence: 0.97,
    tags: ["prisma", "database", "connection", "P1001"],
  },

  {
    id: "prisma.P1002",
    name: "Prisma P1002: Database server timeout",
    matcher: /P1002|The database server at `?(?<host>[^`\s]+)?`? was reached but timed out/i,
    extractor(match: RegExpMatchArray) {
      return { host: match.groups?.["host"] ?? "<unknown>" };
    },
    titleBuilder: () => "Prisma P1002: Database connection timed out",
    explanationBuilder: () =>
      "Prisma reached the database server but the connection attempt timed out before completing. " +
      "The server is responding but too slowly — often due to overload or misconfigured SSL.",
    causesBuilder: () => [
      "Database server is overloaded or under heavy load",
      "SSL/TLS handshake is failing or taking too long",
      "Connection pool is exhausted — all connections are in use",
      "Slow network between the application and database",
    ],
    suggestionsBuilder: () => [
      "Check database server CPU and connection metrics in your DB dashboard",
      "Add `?connect_timeout=10` to the DATABASE_URL to tune the timeout",
      "If behind SSL: try adding `?sslmode=require` or `?ssl=true` to the URL",
      "Increase `connection_limit` in Prisma datasource or reduce pool size",
      "Check for long-running queries blocking connections: `SELECT * FROM pg_stat_activity`",
    ],
    confidence: 0.96,
    tags: ["prisma", "database", "timeout", "P1002"],
  },

  {
    id: "prisma.P1003",
    name: "Prisma P1003: Database does not exist",
    matcher: /P1003|Database `?(?<db>[^`\s]+)?`? does not exist/i,
    extractor(match: RegExpMatchArray) {
      return { db: match.groups?.["db"] ?? "<unknown>" };
    },
    titleBuilder: ({ db }) =>
      `Prisma P1003: Database "${db}" does not exist`,
    explanationBuilder: ({ db }) =>
      `The database "${db}" specified in your connection URL does not exist on the server. ` +
      `It needs to be created before Prisma can connect to it.`,
    causesBuilder: () => [
      "The database was never created",
      "Wrong database name in DATABASE_URL",
      "The database was accidentally dropped",
      "Connecting to the wrong database server (dev vs prod)",
    ],
    suggestionsBuilder: ({ db }) => [
      `Create the database: \`createdb ${db}\` (PostgreSQL) or \`CREATE DATABASE ${db};\` (MySQL)`,
      "Run `npx prisma migrate dev` to create and migrate the database",
      "Verify the database name in your DATABASE_URL connection string",
      "Run `npx prisma db push` to push schema without migrations (prototyping)",
    ],
    confidence: 0.97,
    tags: ["prisma", "database", "P1003"],
  },

  {
    id: "prisma.P1008",
    name: "Prisma P1008: Operations timed out",
    matcher: /P1008|Operations timed out after `?(?<ms>\d+ms)?/i,
    extractor(match: RegExpMatchArray) {
      return { ms: match.groups?.["ms"] ?? "unknown duration" };
    },
    titleBuilder: ({ ms }) => `Prisma P1008: Operation timed out after ${ms}`,
    explanationBuilder: () =>
      "One or more database operations took longer than the configured timeout. " +
      "This is usually a slow query or a deadlock situation.",
    causesBuilder: () => [
      "A query is doing a full table scan on a large unindexed table",
      "A deadlock between two concurrent transactions",
      "Missing database indexes causing slow lookups",
      "The timeout threshold is too low for the workload",
    ],
    suggestionsBuilder: () => [
      "Run EXPLAIN ANALYZE on the slow query to identify bottlenecks",
      "Add indexes for columns used in WHERE, ORDER BY, and JOIN clauses",
      "Increase Prisma timeout: `prisma.$connect()` with engineConfig",
      "Break large transactions into smaller ones",
      "Check for deadlocks in DB logs: `pg_stat_activity` or slow query log",
    ],
    confidence: 0.95,
    tags: ["prisma", "timeout", "P1008"],
  },

  {
    id: "prisma.P1009",
    name: "Prisma P1009: Database already exists",
    matcher: /P1009|Database `?(?<db>[^`\s]+)?`? already exists/i,
    extractor(match: RegExpMatchArray) {
      return { db: match.groups?.["db"] ?? "<unknown>" };
    },
    titleBuilder: ({ db }) => `Prisma P1009: Database "${db}" already exists`,
    explanationBuilder: () =>
      "Prisma tried to create a database that already exists on the server.",
    causesBuilder: () => [
      "Running `prisma migrate dev` on an already-initialised database",
      "A previous setup left a partial database behind",
    ],
    suggestionsBuilder: () => [
      "Drop the existing database if safe: `dropdb <name>` or `DROP DATABASE <name>;`",
      "Use `prisma migrate deploy` instead of `migrate dev` for existing databases",
      "Use `prisma db push --force-reset` to reset and re-push (destructive — dev only)",
    ],
    confidence: 0.95,
    tags: ["prisma", "migrate", "P1009"],
  },

  {
    id: "prisma.P1010",
    name: "Prisma P1010: User access denied",
    matcher: /P1010|User `?(?<user>[^`\s]+)?`? was denied access/i,
    extractor(match: RegExpMatchArray) {
      return { user: match.groups?.["user"] ?? "<unknown>" };
    },
    titleBuilder: ({ user }) => `Prisma P1010: Access denied for user "${user}"`,
    explanationBuilder: ({ user }) =>
      `The database user "${user}" does not have permission to access the requested database or schema. ` +
      `Authentication succeeded but authorisation failed.`,
    causesBuilder: () => [
      "The DB user lacks CONNECT privilege on the database",
      "Missing USAGE privilege on the schema",
      "Row-level security or role restrictions in PostgreSQL",
      "Connecting to a database the user is not granted access to",
    ],
    suggestionsBuilder: ({ user }) => [
      `Grant access: \`GRANT ALL PRIVILEGES ON DATABASE mydb TO ${user};\``,
      `Grant schema usage: \`GRANT USAGE ON SCHEMA public TO ${user};\``,
      "Check the user's roles: `\\du` in psql or `SHOW GRANTS FOR user` in MySQL",
      "Use a superuser connection for migrations if the app user has limited rights",
    ],
    confidence: 0.96,
    tags: ["prisma", "permissions", "P1010"],
  },

  {
    id: "prisma.P1011",
    name: "Prisma P1011: TLS/SSL connection error",
    matcher: /P1011|Error opening a TLS connection/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P1011: TLS/SSL connection error",
    explanationBuilder: () =>
      "Prisma failed to open a TLS/SSL-secured connection to the database. " +
      "The SSL certificate may be invalid, expired, or the server requires a specific SSL mode.",
    causesBuilder: () => [
      "The database requires SSL but `sslmode` is not configured",
      "SSL certificate verification failed (self-signed or expired cert)",
      "The DATABASE_URL is missing SSL parameters",
      "Certificate Authority (CA) bundle is not trusted in this environment",
    ],
    suggestionsBuilder: () => [
      "Add SSL to your connection URL: append `?sslmode=require`",
      "For self-signed certs (dev only): `?sslmode=no-verify` or `ssl=true&sslaccept=accept_invalid_certs`",
      "For production: provide the CA cert path: `?sslcert=/path/to/cert.pem`",
      "Check if the DB server's SSL certificate has expired",
    ],
    confidence: 0.96,
    tags: ["prisma", "ssl", "tls", "P1011"],
  },

  {
    id: "prisma.P1012",
    name: "Prisma P1012: Schema validation error",
    matcher: /P1012|(?:Argument|Type|Field|Model|Enum|Datasource|Generator) .+ is not valid in the current Prisma schema/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P1012: Schema validation error",
    explanationBuilder: () =>
      "Your Prisma schema file (`schema.prisma`) contains a validation error. " +
      "Prisma cannot parse or compile the schema as written.",
    causesBuilder: () => [
      "A model field references an undefined type or relation",
      "Missing `@id` field on a model",
      "Invalid attribute syntax (e.g. `@relation` with wrong args)",
      "Duplicate model or field names",
      "Invalid or unsupported datasource provider",
    ],
    suggestionsBuilder: () => [
      "Run `npx prisma validate` to get detailed schema errors",
      "Run `npx prisma format` to auto-format and catch syntax errors",
      "Check the Prisma schema docs: https://pris.ly/d/prisma-schema",
      "Ensure all @relation fields have matching inverse relations",
    ],
    confidence: 0.94,
    tags: ["prisma", "schema", "P1012"],
  },

  {
    id: "prisma.P1013",
    name: "Prisma P1013: Invalid database string",
    matcher: /P1013|The provided database string is invalid/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P1013: Invalid database connection string",
    explanationBuilder: () =>
      "The DATABASE_URL (or datasource `url`) is not a valid connection string format that Prisma recognises.",
    causesBuilder: () => [
      "Missing protocol prefix (`postgresql://`, `mysql://`, `mongodb://`, etc.)",
      "Special characters in the password not URL-encoded",
      "Malformed URL structure (missing host, port, or database name)",
      "Using a JDBC-style URL instead of the Prisma-supported format",
    ],
    suggestionsBuilder: () => [
      "URL-encode special characters in passwords (e.g. `@` → `%40`, `#` → `%23`)",
      "Format should be: `postgresql://user:password@host:port/dbname`",
      "Use the Prisma connection URL docs: https://pris.ly/d/connection-strings",
      "Check for accidental whitespace or newlines in the .env file",
    ],
    confidence: 0.96,
    tags: ["prisma", "connection", "P1013"],
  },

  {
    id: "prisma.P1014",
    name: "Prisma P1014: Underlying model does not exist",
    matcher: /P1014|The underlying `(?<model>[^`]+)` for model `(?<modelName>[^`]+)` does not exist/i,
    extractor(match: RegExpMatchArray) {
      return {
        model: match.groups?.["model"] ?? "model",
        modelName: match.groups?.["modelName"] ?? "<unknown>",
      };
    },
    titleBuilder: ({ modelName }) =>
      `Prisma P1014: Underlying table for model "${modelName}" does not exist`,
    explanationBuilder: ({ modelName }) =>
      `The database table mapped to the Prisma model "${modelName}" does not exist in the database. ` +
      `The schema and the actual database are out of sync.`,
    causesBuilder: () => [
      "Migrations were not run after schema changes",
      "The table was manually dropped from the database",
      "Connecting to a database that hasn't been migrated yet",
      "`@@map` points to a table name that doesn't exist",
    ],
    suggestionsBuilder: () => [
      "Run pending migrations: `npx prisma migrate dev` (development)",
      "Apply migrations in production: `npx prisma migrate deploy`",
      "Introspect the DB to re-sync the schema: `npx prisma db pull`",
      "Check `@@map` / `@map` attribute values match actual table/column names",
    ],
    confidence: 0.96,
    tags: ["prisma", "migrate", "schema", "P1014"],
  },

  {
    id: "prisma.P1015",
    name: "Prisma P1015: Unsupported database feature",
    matcher: /P1015|Your Prisma schema is using features that are not supported for the version of the database/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P1015: Schema uses unsupported database features",
    explanationBuilder: () =>
      "Your Prisma schema uses features not supported by the current version of your database. " +
      "This often happens when using newer Prisma features with an older DB engine.",
    causesBuilder: () => [
      "Using PostgreSQL-specific features (e.g. enums, arrays) with MySQL",
      "Database engine version is too old for the feature",
      "Using `@@fulltext` indexes on a database that doesn't support them",
    ],
    suggestionsBuilder: () => [
      "Upgrade your database engine to a supported version",
      "Check Prisma feature compatibility matrix: https://pris.ly/d/database-features",
      "Remove unsupported features from the schema or use `Unsupported()` type",
    ],
    confidence: 0.93,
    tags: ["prisma", "schema", "compatibility", "P1015"],
  },

  // ═══════════════════════════════════════════════════════════
  // P2 — PRISMA CLIENT (QUERY) ERRORS
  // ═══════════════════════════════════════════════════════════

  {
    id: "prisma.P2000",
    name: "Prisma P2000: Value too long for column",
    matcher: /P2000|The provided value for the column is too long for the column's type\. Column: `?(?<col>[^`\s]+)?/i,
    extractor(match: RegExpMatchArray) {
      return { col: match.groups?.["col"] ?? "<unknown>" };
    },
    titleBuilder: ({ col }) =>
      `Prisma P2000: Value too long for column "${col}"`,
    explanationBuilder: ({ col }) =>
      `The value you provided for "${col}" exceeds the maximum length defined for that column. ` +
      `The database rejected the insert/update.`,
    causesBuilder: () => [
      "Input string is longer than the column's VARCHAR/CHAR limit",
      "Schema defines `@db.VarChar(n)` but input exceeds n characters",
      "User-supplied data not validated before persisting",
    ],
    suggestionsBuilder: ({ col }) => [
      `Validate and truncate input before saving: ensure \`${col}.length\` is within limits`,
      "Increase the column size in your schema: `@db.VarChar(500)`",
      "Run `npx prisma migrate dev` after updating the column size",
      "Add server-side validation (e.g. Zod schema) to reject oversized inputs early",
    ],
    confidence: 0.96,
    tags: ["prisma", "validation", "P2000"],
  },

  {
    id: "prisma.P2001",
    name: "Prisma P2001: Record not found",
    matcher: /P2001|The record searched for in the where condition \(`(?<model>[^`]+)\.((?<field>[^`]+))\` = `(?<value>[^`]+)`\) does not exist/i,
    extractor(match: RegExpMatchArray) {
      return {
        model: match.groups?.["model"] ?? "<model>",
        field: match.groups?.["field"] ?? "<field>",
        value: match.groups?.["value"] ?? "<value>",
      };
    },
    titleBuilder: ({ model }) =>
      `Prisma P2001: No ${model} record found matching the where clause`,
    explanationBuilder: ({ model, field, value }) =>
      `The \`${model}\` record where \`${field} = "${value}"\` does not exist in the database. ` +
      `Prisma's \`findUniqueOrThrow\` / \`updateOrThrow\` requires the record to exist.`,
    causesBuilder: () => [
      "Using `findUniqueOrThrow` or `updateOrThrow` when the record may not exist",
      "The record was deleted between being read and updated (race condition)",
      "Wrong ID or lookup value passed to the query",
      "Querying a different environment's data (dev vs staging)",
    ],
    suggestionsBuilder: () => [
      "Use `findUnique` and check for null before proceeding",
      "Use `upsert` if you want to create the record if it doesn't exist",
      "Validate the ID/lookup value before running the query",
      "Wrap in try/catch and handle `PrismaClientKnownRequestError` with code P2001",
    ],
    confidence: 0.95,
    tags: ["prisma", "not-found", "P2001"],
  },

  {
    id: "prisma.P2002",
    name: "Prisma P2002: Unique constraint violation",
    matcher: /P2002|Unique constraint failed on the (?:fields|constraint):\s*(?:\((?<fields>[^)]+)\)|`(?<fieldsAlt>[^`]+)`)/i,
    extractor(match: RegExpMatchArray) {
      const raw = match.groups?.["fields"] ?? match.groups?.["fieldsAlt"] ?? "<unknown fields>";
      return { fields: raw.replace(/`/g, "").trim() };
    },
    titleBuilder: ({ fields }) =>
      `Prisma P2002: Unique constraint violated on (${fields})`,
    explanationBuilder: ({ fields }) =>
      `A record with the same value for the unique field(s) \`${fields}\` already exists. ` +
      `Prisma enforces the \`@unique\` or \`@@unique\` constraint defined in your schema.`,
    causesBuilder: () => [
      "Attempting to create a duplicate record (e.g. same email, username, or slug)",
      "A concurrent request created the same record simultaneously (race condition)",
      "Seed or migration scripts inserted conflicting data",
      "Composite unique constraint violated by a combination of field values",
    ],
    suggestionsBuilder: ({ fields }) => [
      `Check for existing record first: \`prisma.<model>.findUnique({ where: { ${fields}: value } })\``,
      "Use `upsert` to handle the conflict gracefully: `prisma.<model>.upsert({ ... })`",
      "Wrap in try/catch and handle error code P2002 to show a user-friendly message",
      "For race conditions: use a database-level transaction with `prisma.$transaction()`",
      `Example: \`if (err.code === 'P2002') throw new Error('${fields} already in use')\``,
    ],
    confidence: 0.98,
    tags: ["prisma", "unique", "constraint", "P2002"],
  },

  {
    id: "prisma.P2003",
    name: "Prisma P2003: Foreign key constraint failed",
    matcher: /P2003|Foreign key constraint failed on the field:\s*`?(?<field>[^`\n]+)?/i,
    extractor(match: RegExpMatchArray) {
      return { field: match.groups?.["field"]?.trim() ?? "<unknown field>" };
    },
    titleBuilder: ({ field }) =>
      `Prisma P2003: Foreign key constraint failed on "${field}"`,
    explanationBuilder: ({ field }) =>
      `The value provided for the foreign key field "${field}" references a record that does not exist in the related table. ` +
      `The database enforces referential integrity.`,
    causesBuilder: () => [
      "Trying to create a child record with a parentId that doesn't exist",
      "The related parent record was deleted before the child was created",
      "Using a hardcoded or stale ID in tests or seed data",
      "Out-of-order data insertion in seed scripts",
    ],
    suggestionsBuilder: ({ field }) => [
      `Ensure the referenced record exists before creating the child: verify \`${field}\` is a valid existing ID`,
      "Insert parent records before child records in seed scripts",
      "Use Prisma nested writes to create parent and child in one operation: `create: { parent: { create: {...} } }`",
      "Wrap in a transaction to ensure atomicity: `prisma.$transaction([...])`",
    ],
    confidence: 0.97,
    tags: ["prisma", "foreign-key", "constraint", "P2003"],
  },

  {
    id: "prisma.P2004",
    name: "Prisma P2004: Constraint failed on database",
    matcher: /P2004|A constraint failed on the database/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P2004: Database constraint failed",
    explanationBuilder: () =>
      "A database-level constraint (check constraint, exclusion, etc.) failed that is not directly " +
      "modelled in the Prisma schema. This is a generic constraint violation from the DB engine.",
    causesBuilder: () => [
      "A CHECK constraint defined directly on the DB table was violated",
      "An exclusion constraint in PostgreSQL failed",
      "A trigger on the table raised an error",
    ],
    suggestionsBuilder: () => [
      "Check the database table for custom CHECK constraints not in the Prisma schema",
      "Inspect DB logs for the specific constraint name that failed",
      "Add the constraint logic to application-layer validation so it fails earlier",
    ],
    confidence: 0.9,
    tags: ["prisma", "constraint", "P2004"],
  },

  {
    id: "prisma.P2005",
    name: "Prisma P2005: Invalid field value type",
    matcher: /P2005|The value `(?<value>[^`]+)` stored in the database for the field `(?<field>[^`]+)` is invalid for the field's type/i,
    extractor(match: RegExpMatchArray) {
      return {
        value: match.groups?.["value"] ?? "<value>",
        field: match.groups?.["field"] ?? "<field>",
      };
    },
    titleBuilder: ({ field }) =>
      `Prisma P2005: Invalid value type for field "${field}"`,
    explanationBuilder: ({ field, value }) =>
      `The value "${value}" stored in the database for field "${field}" does not match the type defined in the Prisma schema. ` +
      `This usually indicates the schema is out of sync with the actual database column type.`,
    causesBuilder: () => [
      "Schema was changed but migration was not run",
      "Data was inserted directly into the DB bypassing Prisma with a different type",
      "Column type was changed in DB but not updated in schema.prisma",
    ],
    suggestionsBuilder: () => [
      "Re-introspect the schema: `npx prisma db pull` to sync types from the DB",
      "Run pending migrations: `npx prisma migrate dev`",
      "Check for manual DB changes that might have altered column types",
    ],
    confidence: 0.94,
    tags: ["prisma", "type", "P2005"],
  },

  {
    id: "prisma.P2006",
    name: "Prisma P2006: Provided value invalid for type",
    matcher: /P2006|The provided value `(?<value>[^`]*)` for `(?<model>[^`]+)` field `(?<field>[^`]+)` is not valid/i,
    extractor(match: RegExpMatchArray) {
      return {
        value: match.groups?.["value"] ?? "",
        model: match.groups?.["model"] ?? "<model>",
        field: match.groups?.["field"] ?? "<field>",
      };
    },
    titleBuilder: ({ model, field }) =>
      `Prisma P2006: Invalid value for ${model}.${field}`,
    explanationBuilder: ({ model, field, value }) =>
      `The value "${value}" you provided for \`${model}.${field}\` is not valid for that field's type. ` +
      `Prisma rejected the input before sending it to the database.`,
    causesBuilder: () => [
      "Passing a string where an Int, Float, or Boolean is expected",
      "Passing null to a required (non-optional) field",
      "Enum value that doesn't match any defined variant",
      "Passing an invalid DateTime format",
    ],
    suggestionsBuilder: ({ field }) => [
      `Validate the type of \`${field}\` before passing it to Prisma`,
      "Use a validation library like Zod: `z.object({ field: z.number() })`",
      "Check the Prisma schema for the expected type of this field",
      "For enums, ensure the value is one of the defined variants",
    ],
    confidence: 0.95,
    tags: ["prisma", "validation", "type", "P2006"],
  },

  {
    id: "prisma.P2007",
    name: "Prisma P2007: Data validation error",
    matcher: /P2007|Data validation error.*?(?<detail>[^\n]+)?/i,
    extractor(match: RegExpMatchArray) {
      return { detail: match.groups?.["detail"]?.trim() ?? "" };
    },
    titleBuilder: () => "Prisma P2007: Data validation error",
    explanationBuilder: () =>
      "Prisma's data validation failed before sending the query to the database. " +
      "The input data does not match the constraints in the schema.",
    causesBuilder: () => [
      "Required field is missing from the create/update input",
      "A relation connect/create payload is malformed",
      "Nested write contains an invalid structure",
    ],
    suggestionsBuilder: () => [
      "Check the error message for the specific field that failed validation",
      "Ensure all required fields are included in the create input",
      "Review nested write syntax in the Prisma docs: https://pris.ly/d/nested-writes",
    ],
    confidence: 0.9,
    tags: ["prisma", "validation", "P2007"],
  },

  {
    id: "prisma.P2008",
    name: "Prisma P2008: Failed to parse query",
    matcher: /P2008|Failed to parse the query/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P2008: Failed to parse query",
    explanationBuilder: () =>
      "Prisma's query engine could not parse the generated query. " +
      "This is usually a Prisma version bug or an unsupported query structure.",
    causesBuilder: () => [
      "Incompatible Prisma Client and Prisma Engine versions",
      "Using an experimental or preview feature that is broken in this version",
      "Very complex nested query that the engine cannot handle",
    ],
    suggestionsBuilder: () => [
      "Run `npx prisma generate` to regenerate the Prisma Client",
      "Update Prisma to the latest version: `npm update prisma @prisma/client`",
      "Report the issue on GitHub: https://github.com/prisma/prisma/issues",
      "Simplify the query structure as a workaround",
    ],
    confidence: 0.93,
    tags: ["prisma", "query", "P2008"],
  },

  {
    id: "prisma.P2009",
    name: "Prisma P2009: Failed to validate query",
    matcher: /P2009|Failed to validate the query/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P2009: Query validation failed",
    explanationBuilder: () =>
      "Prisma could not validate the query against the schema. " +
      "The query references fields, models, or operations that aren't valid.",
    causesBuilder: () => [
      "Querying a field that doesn't exist in the model",
      "Using a filter operator not supported for that field type",
      "Prisma Client is stale and out of sync with schema.prisma",
    ],
    suggestionsBuilder: () => [
      "Run `npx prisma generate` to regenerate the client after schema changes",
      "Check field names match exactly (case-sensitive) what's in schema.prisma",
      "Restart the TypeScript language server in your editor after regenerating",
    ],
    confidence: 0.93,
    tags: ["prisma", "query", "P2009"],
  },

  {
    id: "prisma.P2010",
    name: "Prisma P2010: Raw query failed",
    matcher: /P2010|Raw query failed\. Code: `?(?<code>[^`\s]+)?`?\. Message: `?(?<msg>[^`\n]+)?/i,
    extractor(match: RegExpMatchArray) {
      return {
        code: match.groups?.["code"] ?? "<code>",
        msg: match.groups?.["msg"] ?? "<no message>",
      };
    },
    titleBuilder: ({ code }) => `Prisma P2010: Raw query failed (DB error: ${code})`,
    explanationBuilder: ({ msg }) =>
      `A raw SQL query executed via \`prisma.$queryRaw\` or \`prisma.$executeRaw\` failed. ` +
      `Database message: "${msg}".`,
    causesBuilder: () => [
      "SQL syntax error in the raw query string",
      "Referenced table or column doesn't exist",
      "Permission denied for the database user to run this SQL",
      "SQL injection risk — template literals used instead of parameterised queries",
    ],
    suggestionsBuilder: () => [
      "Test the SQL directly in your DB client (psql, TablePlus, etc.) to isolate the error",
      "Always use Prisma's tagged template literal for safe parameterisation: `prisma.$queryRaw`Sql``",
      "Check database user permissions for the operation",
      "Validate table and column names match the actual DB schema",
    ],
    confidence: 0.95,
    tags: ["prisma", "raw-query", "P2010"],
  },

  {
    id: "prisma.P2011",
    name: "Prisma P2011: Null constraint violation",
    matcher: /P2011|Null constraint violation on the (?:fields|constraint):\s*\(?(?<fields>[^)\n]+)\)?/i,
    extractor(match: RegExpMatchArray) {
      const raw = match.groups?.["fields"] ?? "<unknown>";
      return { fields: raw.replace(/[`()]/g, "").trim() };
    },
    titleBuilder: ({ fields }) =>
      `Prisma P2011: Null constraint violated on field(s): ${fields}`,
    explanationBuilder: ({ fields }) =>
      `The field(s) \`${fields}\` are required (non-nullable) but a null value was provided. ` +
      `The database rejected the operation.`,
    causesBuilder: () => [
      "Creating a record without providing a required field",
      "Setting a non-optional field to null in an update",
      "Missing field in the create payload because it was assumed to have a default",
      "A relation field is null when it is required",
    ],
    suggestionsBuilder: ({ fields }) => [
      `Ensure \`${fields}\` is always provided when creating or updating records`,
      "Add a default value in schema: `fieldName  Type  @default(value)`",
      "Make the field optional in schema if null is a valid state: `fieldName  Type?`",
      "Add input validation before calling Prisma to catch missing fields early",
    ],
    confidence: 0.97,
    tags: ["prisma", "null", "constraint", "P2011"],
  },

  {
    id: "prisma.P2012",
    name: "Prisma P2012: Missing required value",
    matcher: /P2012|Missing a required value at `(?<path>[^`]+)`/i,
    extractor(match: RegExpMatchArray) {
      return { path: match.groups?.["path"] ?? "<unknown path>" };
    },
    titleBuilder: ({ path }) =>
      `Prisma P2012: Missing required value at "${path}"`,
    explanationBuilder: ({ path }) =>
      `The field at path \`${path}\` is required but was not provided in the query input.`,
    causesBuilder: () => [
      "A required nested relation field was omitted from the input",
      "Partial update accidentally left out a required field",
      "TypeScript types were ignored or overridden with `as any`",
    ],
    suggestionsBuilder: ({ path }) => [
      `Provide a value for \`${path}\` in your query input`,
      "Enable strict TypeScript to let Prisma's types catch missing fields at compile time",
      "Review the model schema to see which fields have defaults vs which are required",
    ],
    confidence: 0.95,
    tags: ["prisma", "validation", "P2012"],
  },

  {
    id: "prisma.P2013",
    name: "Prisma P2013: Missing required argument",
    matcher: /P2013|Missing the required argument `(?<arg>[^`]+)` for field `(?<field>[^`]+)` on `(?<model>[^`]+)`/i,
    extractor(match: RegExpMatchArray) {
      return {
        arg: match.groups?.["arg"] ?? "<arg>",
        field: match.groups?.["field"] ?? "<field>",
        model: match.groups?.["model"] ?? "<model>",
      };
    },
    titleBuilder: ({ model, field }) =>
      `Prisma P2013: Missing required argument for ${model}.${field}`,
    explanationBuilder: ({ arg, field, model }) =>
      `The required argument \`${arg}\` is missing when calling \`${model}.${field}\`. ` +
      `Prisma cannot execute the query without it.`,
    causesBuilder: () => [
      "Calling prisma methods without the required `where`, `data`, or `select` argument",
      "Destructuring the input and accidentally dropping a required key",
    ],
    suggestionsBuilder: ({ arg }) => [
      `Add the missing argument \`${arg}\` to your Prisma query call`,
      "Check the Prisma Client API docs for the required argument shape",
      "Use TypeScript — Prisma's generated types will flag missing arguments at compile time",
    ],
    confidence: 0.95,
    tags: ["prisma", "argument", "P2013"],
  },

  {
    id: "prisma.P2014",
    name: "Prisma P2014: Relation violation",
    matcher: /P2014|The change you are trying to make would violate the required relation '(?<relation>[^']+)' between the `(?<modelA>[^`]+)` and `(?<modelB>[^`]+)` models/i,
    extractor(match: RegExpMatchArray) {
      return {
        relation: match.groups?.["relation"] ?? "<relation>",
        modelA: match.groups?.["modelA"] ?? "<ModelA>",
        modelB: match.groups?.["modelB"] ?? "<ModelB>",
      };
    },
    titleBuilder: ({ modelA, modelB }) =>
      `Prisma P2014: Required relation violated between ${modelA} and ${modelB}`,
    explanationBuilder: ({ relation, modelA, modelB }) =>
      `Performing this operation would break the required relation "${relation}" between \`${modelA}\` and \`${modelB}\`. ` +
      `Prisma prevents operations that would leave a required relation dangling.`,
    causesBuilder: () => [
      "Deleting a parent record that has required child records referencing it",
      "Disconnecting a required relation without providing a replacement",
      "Trying to set a required relation field to null",
    ],
    suggestionsBuilder: () => [
      "Delete or reassign child records before deleting the parent",
      "Use cascading deletes in the schema: add `onDelete: Cascade` to the `@relation`",
      "Make the relation optional (`?`) in the schema if null is valid",
      "Use a transaction to atomically reassign children and delete the parent",
    ],
    confidence: 0.96,
    tags: ["prisma", "relation", "P2014"],
  },

  {
    id: "prisma.P2015",
    name: "Prisma P2015: Related record not found",
    matcher: /P2015|A related record could not be found/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P2015: Related record not found",
    explanationBuilder: () =>
      "A nested operation (connect, set, or disconnect) references a related record that doesn't exist in the database.",
    causesBuilder: () => [
      "Using `connect: { id: x }` where `x` doesn't exist",
      "Referencing a related record by a non-unique or non-existent value",
      "Data inconsistency between environments (copied IDs from staging to dev)",
    ],
    suggestionsBuilder: () => [
      "Verify the related record exists before connecting: `prisma.<model>.findUnique({ where: { id } })`",
      "Use `connectOrCreate` to create the related record if it doesn't exist",
      "Ensure IDs are not hardcoded across environments",
    ],
    confidence: 0.94,
    tags: ["prisma", "relation", "P2015"],
  },

  {
    id: "prisma.P2016",
    name: "Prisma P2016: Query interpretation error",
    matcher: /P2016|Query interpretation error/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P2016: Query interpretation error",
    explanationBuilder: () =>
      "Prisma's query engine could not interpret the query correctly. " +
      "This can happen with deeply nested queries or edge cases in the engine.",
    causesBuilder: () => [
      "Overly complex nested query structure",
      "Engine bug in the installed Prisma version",
    ],
    suggestionsBuilder: () => [
      "Update Prisma: `npm update prisma @prisma/client`",
      "Simplify the query by breaking it into multiple smaller queries",
      "Report the issue with a reproduction at https://github.com/prisma/prisma/issues",
    ],
    confidence: 0.88,
    tags: ["prisma", "query", "P2016"],
  },

  {
    id: "prisma.P2017",
    name: "Prisma P2017: Records not connected",
    matcher: /P2017|The records for relation `(?<relation>[^`]+)` between the `(?<modelA>[^`]+)` and `(?<modelB>[^`]+)` models are not connected/i,
    extractor(match: RegExpMatchArray) {
      return {
        relation: match.groups?.["relation"] ?? "<relation>",
        modelA: match.groups?.["modelA"] ?? "<ModelA>",
        modelB: match.groups?.["modelB"] ?? "<ModelB>",
      };
    },
    titleBuilder: ({ modelA, modelB }) =>
      `Prisma P2017: ${modelA} and ${modelB} records are not connected`,
    explanationBuilder: ({ relation, modelA, modelB }) =>
      `The records you're trying to operate on are not connected via the relation "${relation}" ` +
      `between \`${modelA}\` and \`${modelB}\`.`,
    causesBuilder: () => [
      "Trying to disconnect records that were never connected",
      "Operating on the wrong record IDs",
    ],
    suggestionsBuilder: () => [
      "Verify the relation exists before disconnecting",
      "Use `update` with `connect` to first establish the relation",
    ],
    confidence: 0.92,
    tags: ["prisma", "relation", "P2017"],
  },

  {
    id: "prisma.P2018",
    name: "Prisma P2018: Required connected records not found",
    matcher: /P2018|The required connected records were not found/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P2018: Required connected records not found",
    explanationBuilder: () =>
      "Prisma expected connected records (via a relation) but found none. " +
      "A required relation has no records on the other side.",
    causesBuilder: () => [
      "Querying with `include` on a required relation that has no matching records",
      "Data integrity issue — parent without required children",
    ],
    suggestionsBuilder: () => [
      "Ensure the related records exist before querying",
      "Make the relation optional in the schema if no children is a valid state",
    ],
    confidence: 0.9,
    tags: ["prisma", "relation", "P2018"],
  },

  {
    id: "prisma.P2019",
    name: "Prisma P2019: Input error",
    matcher: /P2019|Input error/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P2019: Input error",
    explanationBuilder: () =>
      "Prisma received an input that it cannot process. The query input structure is malformed.",
    causesBuilder: () => [
      "Passing conflicting operations (e.g. both `create` and `connect` for the same relation)",
      "Incorrect nested write structure",
    ],
    suggestionsBuilder: () => [
      "Review the query input structure against the Prisma Client API reference",
      "Only use one of `create`, `connect`, `connectOrCreate` per relation field",
    ],
    confidence: 0.85,
    tags: ["prisma", "input", "P2019"],
  },

  {
    id: "prisma.P2020",
    name: "Prisma P2020: Value out of range",
    matcher: /P2020|Value out of range for the type\. Column: `?(?<col>[^`\s]+)?/i,
    extractor(match: RegExpMatchArray) {
      return { col: match.groups?.["col"] ?? "<column>" };
    },
    titleBuilder: ({ col }) =>
      `Prisma P2020: Value out of range for column "${col}"`,
    explanationBuilder: ({ col }) =>
      `The value provided for column "${col}" exceeds the valid range for its data type. ` +
      `For example, an integer that's larger than Int32 max (2,147,483,647).`,
    causesBuilder: () => [
      "Using a JavaScript `number` larger than a 32-bit INT allows",
      "Storing a BigInt value in an Int column",
      "Timestamp out of valid date range for the DB type",
    ],
    suggestionsBuilder: () => [
      "Change the schema column type to `BigInt` for large numbers",
      "Use `String` for very large numbers if exact arithmetic isn't needed",
      "Validate the range on the application side before persisting",
    ],
    confidence: 0.95,
    tags: ["prisma", "range", "type", "P2020"],
  },

  {
    id: "prisma.P2021",
    name: "Prisma P2021: Table does not exist",
    matcher: /P2021|The table `(?<table>[^`]+)` does not exist in the current database/i,
    extractor(match: RegExpMatchArray) {
      return { table: match.groups?.["table"] ?? "<table>" };
    },
    titleBuilder: ({ table }) =>
      `Prisma P2021: Table "${table}" does not exist`,
    explanationBuilder: ({ table }) =>
      `The database table "${table}" referenced by a Prisma query does not exist. ` +
      `The schema and the database are out of sync.`,
    causesBuilder: () => [
      "Migrations were not applied to this database",
      "The table was manually dropped",
      "Pointing to the wrong database (wrong DATABASE_URL)",
      "`@@map` directive points to a non-existent table name",
    ],
    suggestionsBuilder: () => [
      "Apply migrations: `npx prisma migrate deploy` (prod) or `npx prisma migrate dev` (dev)",
      "Reset and re-migrate (dev only): `npx prisma migrate reset`",
      "Check DATABASE_URL points to the correct database",
      "Verify `@@map` value matches the actual table name",
    ],
    confidence: 0.97,
    tags: ["prisma", "migrate", "P2021"],
  },

  {
    id: "prisma.P2022",
    name: "Prisma P2022: Column does not exist",
    matcher: /P2022|The column `(?<column>[^`]+)` does not exist in the current database/i,
    extractor(match: RegExpMatchArray) {
      return { column: match.groups?.["column"] ?? "<column>" };
    },
    titleBuilder: ({ column }) =>
      `Prisma P2022: Column "${column}" does not exist`,
    explanationBuilder: ({ column }) =>
      `The database column "${column}" referenced by a Prisma query does not exist in the table. ` +
      `The schema is ahead of the applied migrations.`,
    causesBuilder: () => [
      "A new field was added to schema.prisma but migration wasn't run",
      "The column was manually dropped from the DB",
      "`@map` attribute points to a column name that doesn't exist",
    ],
    suggestionsBuilder: () => [
      "Run `npx prisma migrate dev` to create the missing column",
      "Or introspect the DB: `npx prisma db pull` to sync from the actual DB",
      "Check `@map` attribute value matches the real column name",
    ],
    confidence: 0.97,
    tags: ["prisma", "migrate", "P2022"],
  },

  {
    id: "prisma.P2023",
    name: "Prisma P2023: Inconsistent column data",
    matcher: /P2023|Inconsistent column data/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P2023: Inconsistent column data",
    explanationBuilder: () =>
      "The data returned from the database is inconsistent with what Prisma's type system expects. " +
      "This usually means the DB was modified outside of Prisma.",
    causesBuilder: () => [
      "Column type was changed directly in the DB without updating schema.prisma",
      "Null values exist in a column Prisma considers non-nullable",
      "Data was inserted directly bypassing type constraints",
    ],
    suggestionsBuilder: () => [
      "Re-introspect: `npx prisma db pull` to sync the schema to the actual DB types",
      "Audit and clean data that violates the expected type constraints",
      "Run `npx prisma validate` to check schema consistency",
    ],
    confidence: 0.9,
    tags: ["prisma", "data", "P2023"],
  },

  {
    id: "prisma.P2025",
    name: "Prisma P2025: Record to update/delete not found",
    matcher: /P2025|An operation failed because it depends on one or more records that were required but not found/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P2025: Required record not found",
    explanationBuilder: () =>
      "The record you tried to update, delete, or operate on does not exist in the database. " +
      "This is the most common Prisma runtime error — often from `update`, `delete`, or `findUniqueOrThrow`.",
    causesBuilder: () => [
      "Using `prisma.<model>.update({ where: { id } })` with an ID that doesn't exist",
      "Using `prisma.<model>.delete({ where: { id } })` on an already-deleted record",
      "A race condition where another request deleted the record first",
      "Wrong ID passed to the operation (e.g. string ID instead of int)",
      "Using `findUniqueOrThrow` when the record legitimately may not exist",
    ],
    suggestionsBuilder: () => [
      "Use `findUnique` first to check existence before updating/deleting",
      "Switch to `updateMany` which won't throw if no records match",
      "Wrap in try/catch and handle P2025 specifically for user-friendly error messages:",
      "```js\ncatch (e) {\n  if (e.code === 'P2025') throw new NotFoundError();\n}\n```",
      "Use `upsert` if you want to create when not found",
    ],
    confidence: 0.98,
    tags: ["prisma", "not-found", "P2025"],
  },

  {
    id: "prisma.P2026",
    name: "Prisma P2026: Unsupported feature",
    matcher: /P2026|The current database provider doesn't support a feature that the query used/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P2026: Unsupported database feature used in query",
    explanationBuilder: () =>
      "The query uses a Prisma feature that is not supported by your current database provider.",
    causesBuilder: () => [
      "Using `@@fulltext` search on a DB that doesn't support it",
      "Using PostgreSQL-specific operations with MySQL or SQLite",
      "Using preview features not enabled in the schema generator block",
    ],
    suggestionsBuilder: () => [
      "Check the Prisma feature support matrix for your DB provider",
      "Enable preview features in schema.prisma if available: `previewFeatures = [\"fullTextSearch\"]`",
      "Use a raw query as a workaround for unsupported operations",
    ],
    confidence: 0.93,
    tags: ["prisma", "feature", "P2026"],
  },

  {
    id: "prisma.P2028",
    name: "Prisma P2028: Transaction API error",
    matcher: /P2028|Transaction API error/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P2028: Transaction API error",
    explanationBuilder: () =>
      "An error occurred in the Prisma interactive transaction API. " +
      "The transaction may have timed out or the transaction client was used incorrectly.",
    causesBuilder: () => [
      "Transaction timed out (default is 5 seconds)",
      "Using the transaction client outside the transaction callback",
      "An unhandled error inside the transaction caused an implicit rollback",
    ],
    suggestionsBuilder: () => [
      "Increase transaction timeout: `prisma.$transaction([...], { timeout: 10000 })`",
      "Only use the `tx` client inside the transaction callback",
      "Ensure all promises inside the transaction are awaited",
      "Wrap the transaction body in try/catch and re-throw after cleanup",
    ],
    confidence: 0.94,
    tags: ["prisma", "transaction", "P2028"],
  },

  {
    id: "prisma.P2034",
    name: "Prisma P2034: Transaction conflict / deadlock",
    matcher: /P2034|Transaction failed due to a write conflict or a deadlock/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P2034: Transaction deadlock or write conflict",
    explanationBuilder: () =>
      "The transaction failed because of a write conflict or a deadlock with another concurrent transaction. " +
      "The database rolled back the transaction automatically.",
    causesBuilder: () => [
      "Two concurrent transactions modifying the same rows in opposite order",
      "Long-running transactions holding locks while others wait",
      "High concurrency with overlapping write operations",
    ],
    suggestionsBuilder: () => [
      "Implement retry logic with exponential back-off for P2034 errors",
      "Access tables/rows in a consistent order across all transactions to prevent deadlocks",
      "Keep transactions as short as possible — avoid doing I/O inside `$transaction`",
      "Consider optimistic concurrency control using a `version` field",
    ],
    confidence: 0.96,
    tags: ["prisma", "transaction", "deadlock", "P2034"],
  },

  // ═══════════════════════════════════════════════════════════
  // P3 — MIGRATE ERRORS
  // ═══════════════════════════════════════════════════════════

  {
    id: "prisma.P3000",
    name: "Prisma P3000: Failed to create database",
    matcher: /P3000|Failed to create database/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P3000: Failed to create database",
    explanationBuilder: () =>
      "Prisma Migrate could not create the database during `migrate dev` or `migrate reset`.",
    causesBuilder: () => [
      "Insufficient privileges to create databases",
      "Database already exists with conflicting settings",
    ],
    suggestionsBuilder: () => [
      "Create the database manually first: `CREATE DATABASE mydb;`",
      "Grant the DB user `CREATEDB` privilege: `ALTER USER myuser CREATEDB;`",
      "Use `prisma migrate dev --skip-generate` if DB already exists",
    ],
    confidence: 0.94,
    tags: ["prisma", "migrate", "P3000"],
  },

  {
    id: "prisma.P3001",
    name: "Prisma P3001: Destructive migration",
    matcher: /P3001|Migration possible with destructive changes/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P3001: Migration contains destructive changes",
    explanationBuilder: () =>
      "The migration would perform destructive changes (e.g. dropping columns or tables) " +
      "that could result in data loss. Prisma Migrate warns you before applying.",
    causesBuilder: () => [
      "Removing a field from schema.prisma generates a DROP COLUMN migration",
      "Renaming a field generates a DROP + ADD (not ALTER) by default",
      "Removing a model generates a DROP TABLE migration",
    ],
    suggestionsBuilder: () => [
      "Review the generated migration SQL file before applying: `prisma/migrations/`",
      "To rename (not drop+add), edit the migration SQL manually to use `ALTER TABLE ... RENAME COLUMN`",
      "Back up your database before running destructive migrations in production",
      "Use `prisma migrate dev --create-only` to generate without applying, then review",
    ],
    confidence: 0.94,
    tags: ["prisma", "migrate", "destructive", "P3001"],
  },

  {
    id: "prisma.P3002",
    name: "Prisma P3002: Rollback migration",
    matcher: /P3002|The attempted migration was rolled back/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P3002: Migration was rolled back",
    explanationBuilder: () =>
      "A migration failed partway through and was rolled back to preserve database consistency. " +
      "The migration is now in a failed state.",
    causesBuilder: () => [
      "SQL error in the migration file (syntax or constraint issue)",
      "Trying to add a NOT NULL column to a table with existing rows and no default",
      "Adding a unique constraint that is already violated by existing data",
    ],
    suggestionsBuilder: () => [
      "Check `prisma migrate status` to see which migration failed",
      "Fix the SQL in the failed migration file",
      "For NOT NULL columns with existing rows: add a `DEFAULT` value in the migration SQL",
      "For unique constraints: clean up duplicate data first, then re-apply",
      "Mark as resolved after manual fix: `prisma migrate resolve --applied <migration_name>`",
    ],
    confidence: 0.95,
    tags: ["prisma", "migrate", "rollback", "P3002"],
  },

  {
    id: "prisma.P3003",
    name: "Prisma P3003: Migration format changed",
    matcher: /P3003|The format of migrations changed/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P3003: Migration format changed (old format detected)",
    explanationBuilder: () =>
      "Prisma detected old-format migration files (from Prisma 1 or early Prisma 2 experimental migrate). " +
      "These are incompatible with the current Prisma Migrate.",
    causesBuilder: () => [
      "Upgrading from Prisma 1 to Prisma 2/3/4/5",
      "Old `migrations/` folder from an experimental migrate version",
    ],
    suggestionsBuilder: () => [
      "Delete the old `migrations/` folder and run `npx prisma migrate dev` to start fresh",
      "Follow the Prisma 1 → 2 upgrade guide: https://pris.ly/d/upgrading-to-prisma2",
    ],
    confidence: 0.93,
    tags: ["prisma", "migrate", "P3003"],
  },

  {
    id: "prisma.P3005",
    name: "Prisma P3005: Non-empty database schema",
    matcher: /P3005|The database schema is not empty/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P3005: Database schema is not empty",
    explanationBuilder: () =>
      "Prisma Migrate detected that the database already has tables, but there are no migration files. " +
      "Migrate doesn't know how to reconcile the existing DB state.",
    causesBuilder: () => [
      "Running `migrate dev` on an existing database without any migration history",
      "The `prisma/migrations` folder was deleted but the DB still has tables",
    ],
    suggestionsBuilder: () => [
      "To baseline an existing DB: `npx prisma migrate dev --name init` (creates initial snapshot)",
      "Or use `prisma db push` for prototyping without migration files",
      "Introspect the existing DB first: `npx prisma db pull` to generate a matching schema",
      "See baselining docs: https://pris.ly/d/migrate-baseline",
    ],
    confidence: 0.95,
    tags: ["prisma", "migrate", "P3005"],
  },

  {
    id: "prisma.P3006",
    name: "Prisma P3006: Migration failed to apply",
    matcher: /P3006|Migration `(?<migration>[^`]+)` failed to apply cleanly/i,
    extractor(match: RegExpMatchArray) {
      return { migration: match.groups?.["migration"] ?? "<unknown migration>" };
    },
    titleBuilder: ({ migration }) =>
      `Prisma P3006: Migration "${migration}" failed to apply`,
    explanationBuilder: ({ migration }) =>
      `The migration "${migration}" could not be applied to the database. ` +
      `It may have partially executed, leaving the database in an inconsistent state.`,
    causesBuilder: () => [
      "SQL error in the migration (invalid syntax, violated constraint)",
      "The migration assumes a database state that doesn't match",
      "Manually edited migration file introduced a bug",
    ],
    suggestionsBuilder: () => [
      "Check `prisma migrate status` for details",
      "Inspect the migration SQL file at `prisma/migrations/<name>/migration.sql`",
      "After manual fix: `npx prisma migrate resolve --applied <migration_name>`",
      "For dev: `npx prisma migrate reset` to start clean (destructive — dev only)",
    ],
    confidence: 0.95,
    tags: ["prisma", "migrate", "P3006"],
  },

  {
    id: "prisma.P3008",
    name: "Prisma P3008: Migration already applied",
    matcher: /P3008|The migration `(?<migration>[^`]+)` is already recorded as applied in the database/i,
    extractor(match: RegExpMatchArray) {
      return { migration: match.groups?.["migration"] ?? "<unknown>" };
    },
    titleBuilder: ({ migration }) =>
      `Prisma P3008: Migration "${migration}" is already applied`,
    explanationBuilder: () =>
      "Prisma tried to apply a migration that is already recorded in the `_prisma_migrations` table.",
    causesBuilder: () => [
      "Manually running migration files that Prisma already tracks",
      "Migration history is out of sync",
    ],
    suggestionsBuilder: () => [
      "Check migration status: `npx prisma migrate status`",
      "Use `prisma migrate resolve` to mark migrations as applied/rolled-back",
    ],
    confidence: 0.93,
    tags: ["prisma", "migrate", "P3008"],
  },

  {
    id: "prisma.P3009",
    name: "Prisma P3009: Migrate found failed migrations",
    matcher: /P3009|migrate found failed migrations in the target database/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma P3009: Failed migrations detected in database",
    explanationBuilder: () =>
      "Prisma found migrations recorded as FAILED in the `_prisma_migrations` table. " +
      "These must be resolved before new migrations can be applied.",
    causesBuilder: () => [
      "A previous `migrate deploy` or `migrate dev` run failed midway",
      "A migration was manually marked as failed",
    ],
    suggestionsBuilder: () => [
      "Check which migrations failed: `npx prisma migrate status`",
      "Fix the root cause of the failure (bad SQL, data issue, etc.)",
      "Mark as resolved: `npx prisma migrate resolve --rolled-back <migration_name>`",
      "Then re-apply: `npx prisma migrate deploy`",
    ],
    confidence: 0.95,
    tags: ["prisma", "migrate", "P3009"],
  },

  // ═══════════════════════════════════════════════════════════
  // CLIENT INITIALISATION & VALIDATION ERRORS
  // ═══════════════════════════════════════════════════════════

  {
    id: "prisma.client_not_generated",
    name: "Prisma Client not generated",
    matcher: /PrismaClient is unable to run in this browser environment|@prisma\/client did not initialize yet|Cannot find module '\.prisma\/client'|Prisma has detected that there are one or more missing migrations/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma Client is not generated or out of date",
    explanationBuilder: () =>
      "The Prisma Client has not been generated, is missing, or is out of sync with your schema. " +
      "This is the most common setup error when starting a project or after a schema change.",
    causesBuilder: () => [
      "Running the app for the first time without generating the client",
      "Modifying schema.prisma without re-running `prisma generate`",
      "`.prisma/client` was deleted from `node_modules`",
      "Running `npm install` which cleared and reinstalled node_modules without regenerating",
      "Trying to run Prisma Client in a browser environment (not supported)",
    ],
    suggestionsBuilder: () => [
      "Generate the client: `npx prisma generate`",
      "Add `prisma generate` as a `postinstall` script in package.json",
      "In CI/CD pipelines, add `npx prisma generate` before the build step",
      "For Edge/browser environments, use Prisma Accelerate instead",
    ],
    confidence: 0.99,
    tags: ["prisma", "client", "generate"],
  },

  {
    id: "prisma.validation_error",
    name: "PrismaClientValidationError",
    matcher: /PrismaClientValidationError|Argument `?(?<arg>[^`\s]+)?`? is missing|Unknown argument `(?<unknownArg>[^`]+)`/i,
    extractor(match: RegExpMatchArray) {
      return {
        arg: match.groups?.["arg"] ?? match.groups?.["unknownArg"] ?? "<argument>",
        isUnknown: match.groups?.["unknownArg"] ? "true" : "false",
      };
    },
    titleBuilder: ({ arg, isUnknown }) =>
      isUnknown === "true"
        ? `Prisma: Unknown argument "${arg}"`
        : `Prisma: Missing required argument "${arg}"`,
    explanationBuilder: ({ arg, isUnknown }) =>
      isUnknown === "true"
        ? `The argument "${arg}" does not exist on this Prisma model or operation. It may be misspelled or not part of the schema.`
        : `The argument "${arg}" is required but was not provided in the Prisma query call.`,
    causesBuilder: ({ isUnknown }) =>
      isUnknown === "true"
        ? [
            "Typo in a query field name or option",
            "Using a field that was removed from the schema",
            "Prisma Client not regenerated after schema changes",
          ]
        : [
            "Missing `data`, `where`, or `select` in a query",
            "A required relation was not provided in a nested write",
          ],
    suggestionsBuilder: () => [
      "Run `npx prisma generate` after schema changes",
      "Use TypeScript — Prisma's types catch these errors at compile time",
      "Check field names exactly as defined in schema.prisma (case-sensitive)",
    ],
    confidence: 0.95,
    tags: ["prisma", "validation", "client"],
  },

  {
    id: "prisma.rust_panic",
    name: "PrismaClientRustPanicError",
    matcher: /PrismaClientRustPanicError|Rust panic/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma: Internal engine error (Rust panic)",
    explanationBuilder: () =>
      "The Prisma query engine (written in Rust) encountered an unexpected error and panicked. " +
      "This is a bug in Prisma itself, not in your code.",
    causesBuilder: () => [
      "A bug in the installed version of Prisma",
      "Corrupt or incompatible Prisma engine binary",
      "Unsupported platform or architecture",
    ],
    suggestionsBuilder: () => [
      "Update to the latest Prisma version: `npm update prisma @prisma/client`",
      "Delete and reinstall: `rm -rf node_modules && npm install`",
      "Report the issue with full details at: https://github.com/prisma/prisma/issues",
      "Restart the Prisma Client process — the panic is non-recoverable for that instance",
    ],
    confidence: 0.97,
    tags: ["prisma", "engine", "panic"],
  },

  {
    id: "prisma.init_error",
    name: "PrismaClientInitializationError",
    matcher: /PrismaClientInitializationError|Could not connect to the database|error connecting to database|Invalid `prisma\.\w+\(\)`/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma: Client initialisation failed",
    explanationBuilder: () =>
      "Prisma Client failed to initialise a connection to the database. " +
      "This is typically a connection configuration issue caught at startup.",
    causesBuilder: () => [
      "DATABASE_URL environment variable is not set or is empty",
      "Database is not reachable from this environment",
      "Wrong credentials or connection string format",
      "Prisma engine binary is missing or incompatible with the OS/architecture",
    ],
    suggestionsBuilder: () => [
      "Verify DATABASE_URL is set: `echo $DATABASE_URL`",
      "Test the connection directly with a DB client",
      "Run `npx prisma generate` to ensure the engine binary is correct for this platform",
      "Check for `.env` file — Prisma reads it automatically with `dotenv`",
      "In Docker: ensure the DB container is healthy before starting the app",
    ],
    confidence: 0.95,
    tags: ["prisma", "connection", "init"],
  },

  {
    id: "prisma.too_many_connections",
    name: "Prisma Too Many Connections",
    matcher: /too many connections|connection pool|FATAL.*connection/i,
    extractor: () => ({}),
    titleBuilder: () => "Prisma: Too many database connections",
    explanationBuilder: () =>
      "The application has exhausted the database's maximum connection limit. " +
      "Prisma's connection pool is creating more connections than the database allows.",
    causesBuilder: () => [
      "Multiple Prisma Client instances created (should be a singleton)",
      "Connection pool size is too large for the database tier",
      "Hot-reloading in development creating new PrismaClient instances on each reload",
      "Serverless/Edge functions creating a new PrismaClient per invocation",
    ],
    suggestionsBuilder: () => [
      "Make PrismaClient a singleton: export a single shared instance",
      "Reduce pool size in DATABASE_URL: `?connection_limit=5`",
      "For serverless: use Prisma Accelerate (connection pooler) or PgBouncer",
      "In Next.js dev mode, use the global singleton pattern to survive hot-reloads:",
      "```js\nconst globalForPrisma = global as unknown as { prisma: PrismaClient };\nexport const prisma = globalForPrisma.prisma || new PrismaClient();\nif (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;\n```",
    ],
    confidence: 0.94,
    tags: ["prisma", "connection", "pool"],
  },

];

export default prismaErrorPatterns;
