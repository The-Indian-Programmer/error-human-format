import type { HumanizedError } from "../types/index.js";
import { formatFrame } from "../utils/stackParser.js";

/**
 * Minimal ANSI colour helpers — avoids importing chalk in the formatter
 * (chalk is only used in the CLI entry point for user-facing output).
 * These are used only when `color: true` is requested from the formatter.
 */
const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  dim: "\x1b[2m",
  white: "\x1b[37m",
} as const;

function c(color: keyof typeof ANSI, text: string, useColor: boolean): string {
  if (!useColor) return text;
  return `${ANSI[color]}${text}${ANSI.reset}`;
}

function bold(text: string, useColor: boolean): string {
  if (!useColor) return text;
  return `${ANSI.bold}${text}${ANSI.reset}`;
}

/**
 * Format a HumanizedError into a multi-line CLI string.
 *
 * Sections:
 *  ❌ Error Title
 *  👉 Explanation
 *  🔍 Possible Causes
 *  💡 Suggestions
 *  📍 Location (if available)
 *  📊 Confidence
 */
export function formatForCli(result: HumanizedError, useColor: boolean): string {
  const lines: string[] = [];
  const divider = c("dim", "─".repeat(60), useColor);

  // ── Header ──────────────────────────────────────────────────
  lines.push("");
  lines.push(divider);
  lines.push(
    `${c("red", "❌", useColor)} ${bold(result.title, useColor)}`
  );
  if (result.errorType && result.errorType !== result.title) {
    lines.push(c("dim", `   Type: ${result.errorType}`, useColor));
  }
  lines.push(divider);

  // ── Explanation ──────────────────────────────────────────────
  lines.push("");
  lines.push(bold(`${c("cyan", "👉", useColor)} Explanation`, useColor));
  lines.push(`   ${result.explanation}`);

  // ── Possible Causes ──────────────────────────────────────────
  if (result.possibleCauses.length > 0) {
    lines.push("");
    lines.push(bold(`${c("yellow", "🔍", useColor)} Possible Causes`, useColor));
    for (const cause of result.possibleCauses) {
      lines.push(`   ${c("yellow", "•", useColor)} ${cause}`);
    }
  }

  // ── Suggestions ──────────────────────────────────────────────
  if (result.suggestions.length > 0) {
    lines.push("");
    lines.push(bold(`${c("green", "💡", useColor)} Suggestions`, useColor));
    for (let i = 0; i < result.suggestions.length; i++) {
      lines.push(
        `   ${c("green", `${i + 1}.`, useColor)} ${result.suggestions[i] ?? ""}`
      );
    }
  }

  // ── Location ─────────────────────────────────────────────────
  if (result.location) {
    lines.push("");
    lines.push(bold(`${c("cyan", "📍", useColor)} Location`, useColor));
    lines.push(`   ${c("cyan", formatFrame(result.location), useColor)}`);
  }

  // ── Confidence ───────────────────────────────────────────────
  lines.push("");
  const pct = Math.round(result.confidence * 100);
  const confColor =
    result.confidence >= 0.85
      ? "green"
      : result.confidence >= 0.6
      ? "yellow"
      : "red";
  lines.push(
    `${c("dim", "📊 Confidence:", useColor)} ${c(confColor, `${pct}%`, useColor)}`
  );

  // ── Stack (if included) ───────────────────────────────────────
  if (result.stack) {
    lines.push("");
    lines.push(bold(`${c("dim", "📋", useColor)} Stack Trace`, useColor));
    const stackLines = result.stack.split("\n").slice(0, 8); // cap at 8 lines
    for (const sl of stackLines) {
      lines.push(c("dim", `   ${sl}`, useColor));
    }
  }

  lines.push("");
  lines.push(divider);
  lines.push("");

  return lines.join("\n");
}
