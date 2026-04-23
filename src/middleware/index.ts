import type { HumanizeOptions, HumanizedError } from "../types/index.js";
import { humanize } from "../core/humanizer.js";

/**
 * Minimal Express-compatible types to avoid a hard dependency on @types/express.
 * This keeps the package lightweight — consumers with Express already installed
 * will get full type safety automatically.
 */
interface Request {
  method?: string;
  path?: string;
  url?: string;
}

interface Response {
  status(code: number): this;
  json(body: unknown): void;
  headersSent?: boolean;
}

type NextFunction = (err?: unknown) => void;

export interface MiddlewareOptions extends HumanizeOptions {
  /**
   * Whether to expose the humanized error in the response body.
   * Defaults to true. Set to false to use it for logging only.
   */
  exposeToClient?: boolean;
  /**
   * Custom logger for the humanized output.
   * Defaults to console.error.
   */
  logger?: (result: HumanizedError, req: Request) => void;
  /**
   * Transform the response shape before sending.
   * Useful when you want to wrap in `{ error: … }` or add request IDs.
   */
  responseTransformer?: (
    result: HumanizedError,
    req: Request
  ) => Record<string, unknown>;
}

/**
 * Express error-handling middleware.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { errorHumanizerMiddleware } from 'error-humanizer/middleware';
 *
 * const app = express();
 * // ... your routes ...
 * app.use(errorHumanizerMiddleware({ exposeToClient: true }));
 * ```
 */
export function errorHumanizerMiddleware(options: MiddlewareOptions = {}) {
  const {
    exposeToClient = true,
    logger = defaultLogger,
    responseTransformer,
    ...humanizeOptions
  } = options;

  // Express error handlers must have exactly 4 parameters (err, req, res, next)
  return async function errorHumanizerHandler(
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (res.headersSent) {
      next(err);
      return;
    }

    try {
      const input =
        err instanceof Error
          ? err
          : typeof err === "string"
          ? err
          : new Error(String(err));

      const result = await humanize(input, humanizeOptions);

      logger(result, req);

      if (exposeToClient) {
        const body = responseTransformer
          ? responseTransformer(result, req)
          : {
              error: {
                title: result.title,
                explanation: result.explanation,
                suggestions: result.suggestions,
                confidence: result.confidence,
              },
            };

        res.status(500).json(body);
      } else {
        next(err);
      }
    } catch (middlewareErr) {
      // Don't let the middleware itself crash the app
      console.error("[error-humanizer middleware] Internal error:", middlewareErr);
      next(err);
    }
  };
}

function defaultLogger(result: HumanizedError, req: Request): void {
  console.error(
    `[error-humanizer] ${req.method ?? "?"} ${req.path ?? req.url ?? "?"} — ${result.title}`
  );
}
