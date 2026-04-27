import type { ErrorPattern } from "../types/index.js";
import typeErrorPatterns from "../patterns/typeErrors.js";
import referenceErrorPatterns from "../patterns/referenceErrors.js";
import syntaxErrorPatterns from "../patterns/syntaxErrors.js";
import networkErrorPatterns from "../patterns/networkErrors.js";
import promiseErrorPatterns from "../patterns/promiseErrors.js";
import moduleErrorPatterns from "../patterns/moduleErrors.js";
import prismaErrorPatterns from "../patterns/prismaErrors.js";

/**
 * Central registry for all error patterns.
 *
 * Patterns are stored in a Map keyed by ID (O(1) lookup/override) and
 * sorted by confidence descending for sequential matching with early exit.
 */
export class PatternRegistry {
  private readonly patterns: Map<string, ErrorPattern> = new Map();
  /** Sorted flat list — rebuilt lazily whenever a pattern is added */
  private sortedCache: ErrorPattern[] | null = null;

  constructor() {
    const builtIn: ErrorPattern[] = [
      ...typeErrorPatterns,
      ...referenceErrorPatterns,
      ...syntaxErrorPatterns,
      ...networkErrorPatterns,
      ...promiseErrorPatterns,
      ...moduleErrorPatterns,
      ...prismaErrorPatterns,
    ];

    for (const pattern of builtIn) {
      this.register(pattern);
    }
  }

  /**
   * Register a new pattern (built-in or user-supplied).
   * Duplicate IDs are silently overwritten — this lets users override built-ins.
   */
  register(pattern: ErrorPattern): void {
    this.patterns.set(pattern.id, pattern);
    this.sortedCache = null; // invalidate cache
  }

  /**
   * Return all patterns sorted by confidence descending.
   * Lazily computed and cached until the next register() call.
   */
  getSorted(): readonly ErrorPattern[] {
    if (!this.sortedCache) {
      this.sortedCache = [...this.patterns.values()].sort(
        (a, b) => b.confidence - a.confidence
      );
    }
    return this.sortedCache;
  }

  /** Return a specific pattern by its ID, or undefined. */
  get(id: string): ErrorPattern | undefined {
    return this.patterns.get(id);
  }

  /** Total number of registered patterns */
  get size(): number {
    return this.patterns.size;
  }
}

/** Singleton registry shared across all humanize() calls */
export const registry = new PatternRegistry();
