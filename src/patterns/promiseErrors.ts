import type { ErrorPattern } from "../types/index.js";

const promiseErrorPatterns: ErrorPattern[] = [
  // ─── Unhandled Promise Rejection ─────────────────────────────────────────
  {
    id: "promise.unhandled_rejection",
    name: "Unhandled Promise Rejection",
    matcher: /UnhandledPromiseRejection|unhandledRejection|Unhandled promise rejection/i,
    extractor: () => ({}),
    titleBuilder: () => "Unhandled Promise Rejection",
    explanationBuilder: () =>
      "A Promise was rejected but no `.catch()` handler or try/catch block caught the rejection. " +
      "In Node.js 15+ this terminates the process by default.",
    causesBuilder: () => [
      "An async function threw an error with no surrounding try/catch",
      "A `.then()` chain is missing a trailing `.catch()`",
      "A `Promise.all()` call where one promise rejected without being caught",
      "An event handler is an async function whose rejection is not handled",
    ],
    suggestionsBuilder: () => [
      "Add `.catch(err => …)` at the end of every promise chain",
      "Wrap async function bodies in try/catch: `try { await … } catch (err) { … }`",
      "Use `process.on('unhandledRejection', handler)` to log & gracefully exit",
      "Return rejected promises from async functions and handle them at the call site",
    ],
    confidence: 0.94,
    tags: ["promise", "async"],
  },

  // ─── await used outside async ─────────────────────────────────────────
  {
    id: "promise.await_outside_async",
    name: "await used outside async function",
    matcher: /await is only valid in async function|await.*only.*async/i,
    extractor: () => ({}),
    titleBuilder: () => "await used outside an async function",
    explanationBuilder: () =>
      "`await` can only be used inside a function declared with `async`, " +
      "or at the top level of an ES module (top-level await). " +
      "Using it inside a regular synchronous function is a SyntaxError.",
    causesBuilder: () => [
      "Forgetting to add `async` to a function that uses `await`",
      "Using `await` inside an Array method callback like `.map()` or `.forEach()`",
      "Top-level `await` in a CommonJS module (not supported — use ESM)",
    ],
    suggestionsBuilder: () => [
      "Add `async` to the enclosing function: `async function handler() { … }`",
      "For array iteration, use `Promise.all(array.map(async item => await …))`",
      "For top-level await in Node.js, use `.mjs` extension or `\"type\": \"module\"` in package.json",
    ],
    confidence: 0.97,
    tags: ["promise", "async", "syntax"],
  },

  // ─── Promise.all rejection ──────────────────────────────────────────────
  {
    id: "promise.all_settled",
    name: "Promise.all rejection",
    matcher: /Promise\.all|all promises/i,
    extractor: () => ({}),
    titleBuilder: () => "One or more promises in Promise.all rejected",
    explanationBuilder: () =>
      "`Promise.all()` short-circuits and rejects as soon as any one of its input promises rejects. " +
      "The other promises may still be running.",
    causesBuilder: () => [
      "One of the async operations in the array failed",
      "No error handling on individual promises inside the array",
    ],
    suggestionsBuilder: () => [
      "Use `Promise.allSettled()` to handle both fulfilled and rejected outcomes",
      "Add individual `.catch()` handlers per promise to isolate failures",
      "Log which sub-task failed by mapping errors to identifiable results",
    ],
    confidence: 0.75,
    tags: ["promise", "async"],
  },
];

export default promiseErrorPatterns;
