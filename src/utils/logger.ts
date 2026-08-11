import type { HttpMethod } from "../types.js";

const REDACTED = "[REDACTED]";
const SENSITIVE_KEY_PARTS = [
  "authorization",
  "apikey",
  "cookie",
  "credential",
  "passwd",
  "password",
  "privatekey",
  "pwd",
  "secret",
  "session",
  "token",
];
const NON_SENSITIVE_HEADER_KEYS = new Set(["accesscontrolallowcredentials"]);

type MaybePromise<T> = T | Promise<T>;

export type RequestLoggerLevel = "off" | "basic" | "verbose";
export type RequestLoggerConfig = RequestLoggerLevel | false | RequestLogger;

export type RequestLoggerRedactionSource = "body" | "header" | "query";

/** Context provided to a custom logger redaction rule. */
export interface RequestLoggerRedactionContext {
  source: RequestLoggerRedactionSource;
  key?: string;
  path: readonly string[];
  value: unknown;
}

/** Return `true` to replace a value with `[REDACTED]` before it is logged. */
export type RequestLoggerRedactionCallback = (
  context: RequestLoggerRedactionContext,
) => boolean;

export interface RequestLogger {
  level?: RequestLoggerLevel;
  /** Additional key names to redact, matched case-insensitively. */
  redactKeys?: readonly string[];
  /** Adds application-specific redaction rules to the built-in heuristics. */
  shouldRedact?: RequestLoggerRedactionCallback;
  requestStart?: (entry: RequestStartLogEntry) => MaybePromise<void>;
  response?: (entry: ResponseLogEntry) => MaybePromise<void>;
  requestEnd?: (entry: RequestEndLogEntry) => MaybePromise<void>;
}

export interface RequestStartLogEntry<TBody = unknown> {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: TBody;
}

export interface ResponseLogEntry<TBody = unknown> {
  method: HttpMethod;
  url: string;
  status: number;
  statusText: string;
  ok: boolean;
  redirected: boolean;
  type: ResponseType;
  headers: Record<string, string>;
  body: TBody;
}

export interface RequestEndLogEntry {
  method: HttpMethod;
  url: string;
  durationMs: number;
  status?: number;
  ok?: boolean;
  error?: {
    name?: string;
    message: string;
  };
}

const DEFAULT_LOGGER_HOOKS: Omit<RequestLogger, "level"> = {
  requestStart: (entry) => {
    console.log(`[⚡️lighty] ${entry.method} ${entry.url} started`);
  },
  response: (entry) => {
    console.log("[⚡️lighty] response", entry);
  },
  requestEnd: (entry) => {
    const status =
      entry.status == null
        ? "no response"
        : `${entry.status} ${entry.ok ? "ok" : "not ok"}`;
    const error = entry.error ? `; ${entry.error.message}` : "";

    console.log(
      `[⚡️lighty] ${entry.method} ${entry.url} completed in ${entry.durationMs}ms (${status}${error})`,
    );
  },
};

export function redactHeaders(
  headers: Record<string, string>,
  logger?: RequestLogger,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      shouldRedact(key, value, "header", [key], logger) ? REDACTED : value,
    ]),
  );
}

export function redactBody<TBody>(body: TBody, logger?: RequestLogger): TBody {
  return redactValue(body, new WeakSet<object>(), logger, []) as TBody;
}

export function redactUrl(url: URL, logger?: RequestLogger): string {
  const redactedUrl = new URL(url);

  redactedUrl.username = "";
  redactedUrl.password = "";
  redactedUrl.hash = "";

  for (const key of redactedUrl.searchParams.keys()) {
    if (
      shouldRedact(
        key,
        redactedUrl.searchParams.get(key),
        "query",
        [key],
        logger,
      )
    ) {
      redactedUrl.searchParams.set(key, REDACTED);
    }
  }

  return redactedUrl.toString();
}

export async function logRequestStart(
  logger: RequestLogger | undefined,
  createEntry: () => RequestStartLogEntry,
) {
  if (!logger || !shouldLogBasic(logger) || !logger.requestStart) {
    return;
  }

  await logger.requestStart(createEntry());
}

export async function logResponse(
  logger: RequestLogger | undefined,
  createEntry: () => ResponseLogEntry,
) {
  if (!logger || !shouldLogFull(logger) || !logger.response) {
    return;
  }

  await logger.response(createEntry());
}

export async function logRequestEnd(
  logger: RequestLogger | undefined,
  createEntry: () => RequestEndLogEntry,
) {
  if (!logger || !shouldLogBasic(logger) || !logger.requestEnd) {
    return;
  }

  await logger.requestEnd(createEntry());
}

export function toLogError(error: unknown): RequestEndLogEntry["error"] {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    message: String(error),
  };
}

function redactValue(
  value: unknown,
  seen: WeakSet<object>,
  logger: RequestLogger | undefined,
  path: readonly string[],
): unknown {
  if (typeof value === "string" && path.length === 0) {
    return `[String ${value.length} chars]`;
  }

  if (value == null || typeof value !== "object") {
    return value;
  }

  if (value instanceof ArrayBuffer) {
    return `[ArrayBuffer ${value.byteLength} bytes]`;
  }

  if (ArrayBuffer.isView(value)) {
    return `[${value.constructor.name} ${value.byteLength} bytes]`;
  }

  if (value instanceof Blob) {
    return `[Blob ${value.size} bytes${value.type ? ` ${value.type}` : ""}]`;
  }

  if (value instanceof FormData) {
    return `[FormData ${Array.from(value.keys()).length} entries]`;
  }

  if (value instanceof URLSearchParams) {
    return `[URLSearchParams ${Array.from(value.keys()).length} entries]`;
  }

  if (isReadableStream(value)) {
    return "[ReadableStream]";
  }

  if (value instanceof Date) {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((childValue, index) =>
      redactValue(childValue, seen, logger, [...path, String(index)]),
    );
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, childValue]) => [
      key,
      shouldRedact(key, childValue, "body", [...path, key], logger)
        ? REDACTED
        : redactValue(childValue, seen, logger, [...path, key]),
    ]),
  );
}

function isReadableStream(value: object): value is ReadableStream {
  return (
    typeof ReadableStream !== "undefined" && value instanceof ReadableStream
  );
}

function shouldRedact(
  key: string,
  value: unknown,
  source: RequestLoggerRedactionSource,
  path: readonly string[],
  logger: RequestLogger | undefined,
) {
  const normalizedKey = normalizeKey(key);

  return (
    hasCustomRedactKey(normalizedKey, logger) ||
    ((source !== "header" || !NON_SENSITIVE_HEADER_KEYS.has(normalizedKey)) &&
      isSensitiveKey(normalizedKey)) ||
    logger?.shouldRedact?.({ source, key, path, value }) === true
  );
}

function isSensitiveKey(normalizedKey: string) {
  return SENSITIVE_KEY_PARTS.some((part) => normalizedKey.includes(part));
}

function hasCustomRedactKey(
  normalizedKey: string,
  logger: RequestLogger | undefined,
) {
  return (
    logger?.redactKeys?.some((redactKey) => {
      const normalizedRedactKey = normalizeKey(redactKey);
      return (
        normalizedRedactKey.length > 0 &&
        normalizedKey.includes(normalizedRedactKey)
      );
    }) === true
  );
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function resolveLogger(
  logger: RequestLoggerConfig | undefined,
): RequestLogger | undefined {
  if (logger === undefined || logger === false || logger === "off") {
    return undefined;
  }

  if (logger === "basic" || logger === "verbose") {
    return {
      level: logger,
      ...DEFAULT_LOGGER_HOOKS,
    };
  }

  return logger;
}

function shouldLogBasic(logger: RequestLogger) {
  return (logger.level ?? "basic") !== "off";
}

function shouldLogFull(logger: RequestLogger) {
  return logger.level === "verbose";
}
