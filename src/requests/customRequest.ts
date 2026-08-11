import {
  logRequestEnd,
  logRequestStart,
  logResponse,
  redactBody,
  redactHeaders,
  redactUrl,
  resolveLogger,
  toLogError,
} from "../utils/logger.js";
import { HttpRequestError } from "./errors.js";
import {
  buildRequestUrl,
  createRequestSignal,
  mergeHeaders,
} from "./internals.js";
import { applyResponseParser, parseResponseBody } from "./response.js";
import type { RequestConfig, RequestResult } from "./types.js";

export async function customRequest<TResponse = unknown, TBody = unknown>(
  config: RequestConfig<TBody, TResponse>,
): Promise<RequestResult<TResponse>> {
  const logger = resolveLogger(config.logger);
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
  let response: Response | undefined;
  let responseBody: TResponse | undefined;
  let requestError: unknown;

  await logRequestStart(logger, () => ({
    method: config.method,
    url: redactUrl(url, logger),
    headers: redactHeaders(headers, logger),
    ...(config.body == null ? {} : { body: redactBody(config.body, logger) }),
  }));

  try {
    const fetchedResponse = await fetch(url, {
      method: config.method,
      headers,
      body: requestBody.body,
      ...(isReadableStream(requestBody.body) ? { duplex: "half" } : {}),
      redirect: config.redirect,
      signal: createRequestSignal(config.signal, config.timeoutMs),
    });
    response = fetchedResponse;

    const parsedResponseBody = await parseResponseBody(
      fetchedResponse,
      url.toString(),
      config.responseType,
    );
    responseBody = await applyResponseParser(
      parsedResponseBody,
      fetchedResponse,
      config.responseParser,
    );

    await logResponse(logger, () => ({
      method: config.method,
      url: redactUrl(url, logger),
      status: fetchedResponse.status,
      statusText: fetchedResponse.statusText,
      ok: fetchedResponse.ok,
      redirected: fetchedResponse.redirected,
      type: fetchedResponse.type,
      headers: redactHeaders(
        Object.fromEntries(fetchedResponse.headers.entries()),
        logger,
      ),
      body: redactBody(responseBody, logger),
    }));

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
    await logRequestEnd(logger, () => ({
      method: config.method,
      url: redactUrl(url, logger),
      durationMs: Date.now() - startedAt,
      status: response?.status,
      ok: response?.ok,
      ...(requestError === undefined
        ? {}
        : { error: toLogError(requestError) }),
    }));
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
  return (
    typeof ReadableStream !== "undefined" && value instanceof ReadableStream
  );
}
