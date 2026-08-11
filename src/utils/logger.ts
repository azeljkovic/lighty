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
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      isSensitiveHeaderKey(key) ? REDACTED : value,
    ]),
  );
}

export function redactBody<TBody>(body: TBody): TBody {
  return redactValue(body, new WeakSet<object>()) as TBody;
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

function redactValue(value: unknown, seen: WeakSet<object>): unknown {
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
    return value.map((childValue) => redactValue(childValue, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, childValue]) => [
      key,
      isSensitiveKey(key) ? REDACTED : redactValue(childValue, seen),
    ]),
  );
}

function isReadableStream(value: object): value is ReadableStream {
  return (
    typeof ReadableStream !== "undefined" && value instanceof ReadableStream
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
