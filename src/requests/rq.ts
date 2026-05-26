import {logRequestEnd, logRequestStart, logResponse} from "../utils/logger.js";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";


export interface RequestConfig<TBody = unknown> {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: TBody;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface MethodConfig<TBody = unknown> {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: TBody;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function request<TResponse = unknown, TBody = unknown>(
  config: RequestConfig<TBody>
): Promise<TResponse> {
  const url = new URL(config.url);

  if (config.params) {
    for (const [key, value] of Object.entries(config.params)) {
      if (Array.isArray(value)) {
        value.forEach(v => {
          if (v != null) url.searchParams.append(key, String(v));
        });
      } else if (value != null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  logRequestStart(config.method, url);

  const headers = {
    Accept: "application/json",
    ...(config.body == null ? {} : {"Content-Type": "application/json"}),
    ...config.headers,
  };

  const response = await fetch(url, {
    method: config.method,
    headers,
    body: config.body == null ? undefined : JSON.stringify(config.body),
    signal: config.signal,
  });

  await logResponse(response);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  logRequestEnd(config.method, url);

  return await parseResponseBody<TResponse>(response);
}

async function parseResponseBody<TResponse>(response: Response): Promise<TResponse> {
  const text = await response.text();

  if (!text) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return JSON.parse(text) as TResponse;
  }

  return text as TResponse;
}
