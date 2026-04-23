/**
 * The structured output returned by the humanize() function.
 */
export interface HumanizedError {
  /** Short, descriptive title of the error */
  title: string;
  /** Plain-English explanation of what went wrong */
  explanation: string;
  /** List of likely root causes */
  possibleCauses: string[];
  /** Actionable steps to fix the problem */
  suggestions: string[];
  /** 0–1 confidence score for this match */
  confidence: number;
  /** Parsed location from stack trace (if available) */
  location?: StackFrame;
  /** The original error type (e.g., "TypeError") */
  errorType?: string;
  /** Raw stack trace string (present when includeStack: true) */
  stack?: string;
}

/**
 * A single frame extracted from a stack trace.
 * All fields are optional — not every frame has every piece of info.
 */
export interface StackFrame {
  /** Function or method name */
  functionName?: string | undefined;
  /** Source file path */
  fileName?: string | undefined;
  /** 1-based line number */
  lineNumber?: number | undefined;
  /** 1-based column number */
  columnNumber?: number | undefined;
  /** Whether this frame is from node_modules */
  isNative?: boolean | undefined;
  /** Whether this frame was identified as the most relevant */
  isRelevant?: boolean | undefined;
}

/**
 * Options passed to the humanize() function.
 */
export interface HumanizeOptions {
  /** Include full stack trace in output (default: false) */
  includeStack?: boolean;
  /** Enable verbose diagnostic output (default: false) */
  verbose?: boolean;
  /** Apply color codes to output strings (default: false) */
  color?: boolean;
  /** Print internal pattern matching decisions (default: false) */
  debugMode?: boolean;
  /**
   * Custom AI fallback handler when no pattern matches.
   * Receives the normalized error message; should return HumanizedError.
   */
  aiFallback?: AiFallbackHandler;
}

/**
 * A pluggable AI fallback provider signature.
 */
export type AiFallbackHandler = (
  message: string,
  errorType?: string
) => Promise<HumanizedError> | HumanizedError;

/**
 * A single error pattern — the core unit of the pattern engine.
 */
export interface ErrorPattern {
  /** Unique pattern identifier */
  id: string;
  /** Human-readable name for this pattern */
  name: string;
  /**
   * Regex used to detect a match.
   * Named capturing groups (e.g. `(?<prop>...)`) are passed to the builder fns.
   */
  matcher: RegExp;
  /**
   * Optional: refine the raw RegExpMatchArray into a typed shape
   * before it reaches the builder functions.
   */
  extractor?: (match: RegExpMatchArray) => Record<string, string>;
  /** Build the title from extracted groups */
  titleBuilder: (groups: Record<string, string>) => string;
  /** Build the explanation from extracted groups */
  explanationBuilder: (groups: Record<string, string>) => string;
  /** Build possible causes from extracted groups */
  causesBuilder: (groups: Record<string, string>) => string[];
  /** Build actionable suggestions from extracted groups */
  suggestionsBuilder: (groups: Record<string, string>) => string[];
  /**
   * Static confidence hint for this pattern (0–1).
   * The engine may lower it dynamically if other signals are weak.
   */
  confidence: number;
  /** Tags help organise and filter patterns (e.g. "network", "syntax") */
  tags?: string[];
}

/**
 * Accepted input shapes for humanize().
 */
export type ErrorInput = string | Error | { message: string; stack?: string };
