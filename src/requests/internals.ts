import type { RequestParams } from "./types.js";

export function buildRequestUrl(url: string, params?: RequestParams): URL {
  const requestUrl = new URL(url);

  if (!params) {
    return requestUrl;
  }

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v != null) requestUrl.searchParams.append(key, String(v));
      });
    } else if (value != null) {
      requestUrl.searchParams.set(key, String(value));
    }
  }

  return requestUrl;
}

export function createRequestSignal(
  signal?: AbortSignal,
  timeoutMs?: number,
): AbortSignal | undefined {
  if (timeoutMs == null) {
    return signal;
  }

  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  if (!signal) {
    return timeoutSignal;
  }

  return AbortSignal.any([signal, timeoutSignal]);
}

export function resolveClientUrl(url: string, baseUrl: string | undefined) {
  if (!baseUrl || isAbsoluteUrl(url)) {
    return url;
  }

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedUrl = url.replace(/^\/+/, "");

  return new URL(normalizedUrl, normalizedBaseUrl).toString();
}

export function mergeHeaders(
  ...headers: Array<HeadersInit | undefined>
): Record<string, string> {
  const merged: Record<string, string> = {};
  const headerNames = new Map<string, string>();

  for (const headerInit of headers) {
    for (const [key, value] of headersEntries(headerInit)) {
      const normalizedKey = key.toLowerCase();
      const previousKey = headerNames.get(normalizedKey);

      if (previousKey && previousKey !== key) {
        delete merged[previousKey];
      }

      merged[key] = value;
      headerNames.set(normalizedKey, key);
    }
  }

  return merged;
}

function isAbsoluteUrl(url: string) {
  return /^[a-z][a-z\d+\-.]*:/i.test(url);
}

function headersEntries(headers?: HeadersInit): Array<[string, string]> {
  if (!headers) {
    return [];
  }

  if (headers instanceof Headers) {
    return Array.from(headers.entries());
  }

  if (Array.isArray(headers)) {
    return headers;
  }

  return Object.entries(headers);
}
