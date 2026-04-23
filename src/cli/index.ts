#!/usr/bin/env node

import { program } from "commander";
import { humanize } from "../core/humanizer.js";
import { formatForCli } from "./formatter.js";

// Read version from package.json without bundler magic
const VERSION = "1.0.0";

program
  .name("error-humanizer")
  .description("Convert JS/Node.js errors into human-readable explanations")
  .version(VERSION)
  .argument("[error]", "Error message or stack trace to analyse")
  .option("--no-color", "Disable coloured output")
  .option("-s, --stack", "Include raw stack trace in output")
  .option("-v, --verbose", "Enable verbose/debug output")
  .option("--json", "Output raw JSON instead of formatted CLI output")
  .action(async (errorArg: string | undefined, opts: {
    color: boolean;
    stack: boolean;
    verbose: boolean;
    json: boolean;
  }) => {
    // ── Input acquisition ──────────────────────────────────────
    let input: string;

    if (errorArg) {
      input = errorArg;
    } else if (!process.stdin.isTTY) {
      // Piped input: echo "TypeError: …" | error-humanizer
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
      }
      input = Buffer.concat(chunks).toString("utf8").trim();
    } else {
      program.help();
      process.exit(0);
    }

    if (!input || input.trim() === "") {
      console.error("error-humanizer: No error input provided.");
      console.error("Usage: error-humanizer \"<error message>\"");
      process.exit(1);
    }

    // ── Humanize ───────────────────────────────────────────────
    try {
      const result = await humanize(input, {
        includeStack: opts.stack,
        verbose: opts.verbose,
        debugMode: opts.verbose,
      });

      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        const useColor = opts.color && process.stdout.isTTY !== false;
        process.stdout.write(formatForCli(result, useColor));
      }

      process.exit(0);
    } catch (err) {
      console.error("[error-humanizer] Unexpected internal error:", err);
      process.exit(1);
    }
  });

program.parse(process.argv);
