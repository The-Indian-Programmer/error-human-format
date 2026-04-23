import type { ErrorPattern } from "../types/index.js";

const networkErrorPatterns: ErrorPattern[] = [
  // ─── Axios network error ────────────────────────────────────────────────
  {
    id: "network.axios_network_error",
    name: "Axios Network Error",
    matcher: /Network Error|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND/,
    extractor(match: RegExpMatchArray) {
      const code = match[0]?.match(/E[A-Z]+/)?.[0] ?? "NETWORK_ERROR";
      return { code };
    },
    titleBuilder: ({ code }) => `Network Error: ${code}`,
    explanationBuilder: ({ code }) => {
      const descriptions: Record<string, string> = {
        ECONNREFUSED: "The target server actively refused the connection. The server may be down or not listening on that port.",
        ECONNRESET: "The connection was forcibly closed by the remote server mid-request.",
        ETIMEDOUT: "The request timed out before the server responded.",
        ENOTFOUND: "DNS lookup failed — the hostname could not be resolved to an IP address.",
        NETWORK_ERROR: "A network error occurred. The server may be unreachable or the request was blocked.",
      };
      return descriptions[code] ?? descriptions["NETWORK_ERROR"]!;
    },
    causesBuilder: ({ code }) => {
      const base = [
        "The server is not running or crashed",
        "A firewall or proxy is blocking the request",
        "Incorrect host or port in the request URL",
      ];
      if (code === "ENOTFOUND") {
        return ["The hostname is misspelled or doesn't exist", "DNS is not configured correctly", ...base];
      }
      if (code === "ETIMEDOUT") {
        return ["The server is overloaded or slow", "The timeout threshold is too low", ...base];
      }
      return base;
    },
    suggestionsBuilder: ({ code }) => [
      "Verify the server is running and accessible: `curl <url>`",
      "Check the request URL for typos in the protocol, host, or port",
      code === "ETIMEDOUT"
        ? "Increase the timeout: `axios.create({ timeout: 10000 })`"
        : "Confirm the port is open: `netstat -tlnp | grep <port>`",
      "Inspect your firewall rules or proxy settings",
      "Add retry logic with exponential back-off for transient errors",
    ],
    confidence: 0.92,
    tags: ["network", "axios", "fetch"],
  },

  // ─── HTTP 4xx / 5xx responses ───────────────────────────────────────────
  {
    id: "network.http_error_status",
    name: "HTTP Error Status",
    matcher: /(?:Request failed with status code\s+|HTTP Error[:\s]+)(?<status>\d{3})/i,
    extractor(match: RegExpMatchArray) {
      const status = match.groups?.["status"] ?? "000";
      return { status };
    },
    titleBuilder: ({ status }) => `HTTP ${status} Error`,
    explanationBuilder: ({ status }) => {
      const code = parseInt(status, 10);
      if (code === 400) return "The server rejected the request because it was malformed or missing required data (400 Bad Request).";
      if (code === 401) return "The request requires authentication. No valid credentials were provided (401 Unauthorized).";
      if (code === 403) return "The server understood the request but refuses to fulfil it. You don't have permission (403 Forbidden).";
      if (code === 404) return "The requested resource does not exist on the server (404 Not Found).";
      if (code === 409) return "The request conflicts with the current state of the server resource (409 Conflict).";
      if (code === 422) return "The server understands the content type but cannot process the instructions (422 Unprocessable Entity).";
      if (code === 429) return "Too many requests have been sent in a given time — you are being rate-limited (429 Too Many Requests).";
      if (code >= 500) return `A server-side error occurred (${status}). The problem is on the server, not your request.`;
      return `The server returned HTTP ${status}.`;
    },
    causesBuilder: ({ status }) => {
      const code = parseInt(status, 10);
      if (code === 401) return ["Missing or expired auth token / API key", "Wrong Authorization header format"];
      if (code === 403) return ["Insufficient permissions for this resource", "CORS policy blocking the request"];
      if (code === 404) return ["Wrong URL or resource path", "Resource was deleted or never existed"];
      if (code === 429) return ["Sending requests too frequently", "Exceeded API rate limit quota"];
      if (code >= 500) return ["Bug or unhandled exception in the server code", "Server is overloaded", "Dependency (DB, cache) is down"];
      return ["Malformed request body", "Missing required fields or headers"];
    },
    suggestionsBuilder: ({ status }) => {
      const code = parseInt(status, 10);
      if (code === 401) return ["Check your API key or token is valid and not expired", "Verify the Authorization header format"];
      if (code === 429) return ["Implement exponential back-off and retry logic", "Check the Retry-After response header", "Cache responses to reduce request frequency"];
      if (code >= 500) return ["Check server logs for the root cause", "Retry after a delay — it may be transient", "Contact the API provider if it persists"];
      return ["Log and inspect the full response body for error details", "Validate your request payload matches the API contract"];
    },
    confidence: 0.93,
    tags: ["network", "http"],
  },

  // ─── fetch failed / TypeError: Failed to fetch ──────────────────────────
  {
    id: "network.fetch_failed",
    name: "Fetch Failed",
    matcher: /Failed to fetch|fetch is not defined|TypeError.*fetch/,
    extractor: () => ({}),
    titleBuilder: () => "Fetch Request Failed",
    explanationBuilder: () =>
      "`fetch()` failed before receiving a response. This typically means a network-level " +
      "error occurred (no internet, CORS block, or the `fetch` API is unavailable in this environment).",
    causesBuilder: () => [
      "No internet / network connectivity",
      "CORS policy blocked the request (browser environment)",
      "`fetch` is not available in this Node.js version (requires Node 18+)",
      "The URL is malformed",
      "A browser extension or proxy intercepted the request",
    ],
    suggestionsBuilder: () => [
      "In Node.js < 18, install `node-fetch` or upgrade Node.js",
      "Check the browser console for CORS-related errors",
      "Verify the URL is correct and the server supports CORS if calling cross-origin",
      "Use a try/catch with `await fetch()` and log the caught error",
    ],
    confidence: 0.88,
    tags: ["network", "fetch"],
  },

  // ─── JSON parse after fetch ─────────────────────────────────────────────
  {
    id: "network.invalid_json_response",
    name: "Invalid JSON in Response",
    matcher: /is not valid JSON|invalid json|JSON\.parse.*fetch|SyntaxError.*JSON/i,
    extractor: () => ({}),
    titleBuilder: () => "Response body is not valid JSON",
    explanationBuilder: () =>
      "A `response.json()` call (or `JSON.parse()`) failed because the server did not return " +
      "valid JSON. The response body might be an HTML error page, plain text, or empty.",
    causesBuilder: () => [
      "The server returned an HTML error page (e.g. nginx 404 / 500)",
      "The Content-Type is `text/plain` or `text/html` instead of `application/json`",
      "The response body is empty",
    ],
    suggestionsBuilder: () => [
      "Use `response.text()` first to inspect the raw response body",
      "Check `response.ok` or `response.status` before calling `.json()`",
      "Ensure your Accept header is set: `headers: { Accept: 'application/json' }`",
    ],
    confidence: 0.91,
    tags: ["network", "json"],
  },
];

export default networkErrorPatterns;
