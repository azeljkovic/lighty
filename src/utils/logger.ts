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

export type RequestLoggerLevel = "off" | "basic" | "full";
export type RequestLoggerConfig = RequestLoggerLevel | false | RequestLogger;

export interface RequestLogger {
  level?: RequestLoggerLevel;
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
    console.log(`[lighty] ${entry.method} ${entry.url} started`);
  },
  response: (entry) => {
    console.log("[lighty] response", entry);
  },
  requestEnd: (entry) => {
    const status =
      entry.status == null
        ? "no response"
        : `${entry.status} ${entry.ok ? "ok" : "not ok"}`;
    const error = entry.error ? `; ${entry.error.message}` : "";

    console.log(
      `[lighty] ${entry.method} ${entry.url} completed in ${entry.durationMs}ms (${status}${error})`,
    );
  },
};

export function redactHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      isSensitiveHeaderKey(key) ? REDACTED : value,
    ]),
  );
}

export function redactBody<TBody>(body: TBody): TBody {
  return redactValue(body) as TBody;
}

export function redactUrl(url: URL): string {
  const redactedUrl = new URL(url);

  for (const key of redactedUrl.searchParams.keys()) {
    if (isSensitiveKey(key)) {
      redactedUrl.searchParams.set(key, REDACTED);
    }
  }

  return redactedUrl.toString();
}

export async function logRequestStart(
  logger: RequestLoggerConfig | undefined,
  entry: RequestStartLogEntry,
) {
  const activeLogger = getActiveLogger(logger);

  if (!activeLogger || !shouldLogBasic(activeLogger)) {
    return;
  }

  await activeLogger.requestStart?.(entry);
}

export async function logResponse(
  logger: RequestLoggerConfig | undefined,
  entry: ResponseLogEntry,
) {
  const activeLogger = getActiveLogger(logger);

  if (!activeLogger || !shouldLogFull(activeLogger)) {
    return;
  }

  await activeLogger.response?.(entry);
}

export async function logRequestEnd(
  logger: RequestLoggerConfig | undefined,
  entry: RequestEndLogEntry,
) {
  const activeLogger = getActiveLogger(logger);

  if (!activeLogger || !shouldLogBasic(activeLogger)) {
    return;
  }

  await activeLogger.requestEnd?.(entry);
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

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (value == null || typeof value !== "object") {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, childValue]) => [
      key,
      isSensitiveKey(key) ? REDACTED : redactValue(childValue),
    ]),
  );
}

function isSensitiveKey(key: string) {
  const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");

  return SENSITIVE_KEY_PARTS.some((part) => normalizedKey.includes(part));
}

function isSensitiveHeaderKey(key: string) {
  const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");

  return (
    !NON_SENSITIVE_HEADER_KEYS.has(normalizedKey) &&
    SENSITIVE_KEY_PARTS.some((part) => normalizedKey.includes(part))
  );
}

function getActiveLogger(
  logger: RequestLoggerConfig | undefined,
): RequestLogger | undefined {
  if (logger === false || logger === "off") {
    return undefined;
  }

  if (logger === undefined || logger === "basic" || logger === "full") {
    return {
      level: logger ?? "basic",
      ...DEFAULT_LOGGER_HOOKS,
    };
  }

  return logger;
}

function shouldLogBasic(logger: RequestLogger) {
  return (logger.level ?? "basic") !== "off";
}

function shouldLogFull(logger: RequestLogger) {
  return logger.level === "full";
}
