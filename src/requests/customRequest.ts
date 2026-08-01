import {
  logRequestEnd,
  logRequestStart,
  logResponse,
  redactBody,
  redactHeaders,
  redactUrl,
  toLogError,
} from "../utils/logger.js";
import { HttpRequestError } from "./errors.js";
import {
  buildRequestUrl,
  createRequestSignal,
  mergeHeaders,
} from "./internals.js";
import { getLogResponseBody, parseResponseBody } from "./response.js";
import type { RequestConfig, RequestResult } from "./types.js";

export async function customRequest<TResponse = unknown, TBody = unknown>(
  config: RequestConfig<TBody>,
): Promise<RequestResult<TResponse>> {
  const url = buildRequestUrl(config.url, config.params);
  const requestBody = serializeRequestBody(config.body);
  const headers = mergeHeaders(
    {
      Accept: "application/json",
      ...(requestBody.isJson ? { "Content-Type": "application/json" } : {}),
    },
    config.headers,
  );

  const startedAt = Date.now();
  const logUrl = redactUrl(url);
  const logHeaders = redactHeaders(headers);
  let response: Response | undefined;
  let responseBody: TResponse | undefined;
  let requestError: unknown;

  await logRequestStart(config.logger, {
    method: config.method,
    url: logUrl,
    headers: logHeaders,
    ...(config.body == null ? {} : { body: redactBody(config.body) }),
  });

  try {
    response = await fetch(url, {
      method: config.method,
      headers,
      body: requestBody.body,
      ...(isReadableStream(requestBody.body) ? { duplex: "half" } : {}),
      redirect: config.redirect,
      signal: createRequestSignal(config.signal, config.timeoutMs),
    });

    responseBody = await parseResponseBody<TResponse>(
      response,
      url.toString(),
      config.responseType,
    );

    await logResponse(config.logger, {
      method: config.method,
      url: logUrl,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      redirected: response.redirected,
      type: response.type,
      headers: redactHeaders(Object.fromEntries(response.headers.entries())),
      body: getLogResponseBody(responseBody, config.responseType),
    });

    if (!response.ok && config.throwOnHttpError === true) {
      throw new HttpRequestError<TResponse>({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
        url: response.url || url.toString(),
      });
    }

    return {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseBody,
      response,
    };
  } catch (error) {
    requestError = error;
    throw error;
  } finally {
    await logRequestEnd(config.logger, {
      method: config.method,
      url: logUrl,
      durationMs: Date.now() - startedAt,
      status: response?.status,
      ok: response?.ok,
      ...(requestError === undefined
        ? {}
        : { error: toLogError(requestError) }),
    });
  }
}

function serializeRequestBody(body: unknown): {
  body: BodyInit | undefined;
  isJson: boolean;
} {
  if (body == null) {
    return { body: undefined, isJson: false };
  }

  if (isNativeRequestBody(body)) {
    return { body, isJson: false };
  }

  return { body: JSON.stringify(body), isJson: true };
}

function isNativeRequestBody(value: unknown): value is BodyInit {
  return (
    typeof value === "string" ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    isReadableStream(value)
  );
}

function isReadableStream(value: unknown): value is ReadableStream {
  return typeof ReadableStream !== "undefined" && value instanceof ReadableStream;
}
