import {
  logRequestEnd,
  logRequestStart,
  logResponse,
  redactBody,
  redactHeaders,
  redactUrl,
  toLogError,
} from "../utils/logger.js";
import type { HttpMethod } from "../types.js";
import type { RequestLoggerConfig } from "../utils/logger.js";

type BodylessMethodConfig = Omit<MethodConfig, "body">;
type RequestParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;
type RequestParams = Record<string, RequestParamValue>;

export interface RequestResult<TResponse = unknown> {
  response: Response;
  body: TResponse;
}

export interface HttpRequestErrorOptions<TBody = unknown> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: TBody;
  url: string;
}

export interface InvalidJsonResponseErrorOptions {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  url: string;
  cause: unknown;
}

export class HttpRequestError<TBody = unknown> extends Error {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: TBody;
  url: string;

  constructor(options: HttpRequestErrorOptions<TBody>) {
    super(`Request failed with status ${options.status}`);
    this.name = "HttpRequestError";
    this.status = options.status;
    this.statusText = options.statusText;
    this.headers = options.headers;
    this.body = options.body;
    this.url = options.url;
  }
}

export class InvalidJsonResponseError extends Error {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  url: string;

  constructor(options: InvalidJsonResponseErrorOptions) {
    super(
      `Failed to parse JSON response from ${options.url} (status ${options.status})`,
      { cause: options.cause },
    );
    this.name = "InvalidJsonResponseError";
    this.status = options.status;
    this.statusText = options.statusText;
    this.headers = options.headers;
    this.body = options.body;
    this.url = options.url;
  }
}

export interface RequestConfig<TBody = unknown> {
  method: HttpMethod;
  url: string;
  headers?: HeadersInit;
  params?: RequestParams;
  body?: TBody;
  signal?: AbortSignal;
  timeoutMs?: number;
  throwOnHttpError?: boolean;
  logger?: RequestLoggerConfig;
}

export interface MethodConfig<TBody = unknown> {
  headers?: HeadersInit;
  params?: RequestParams;
  body?: TBody;
  signal?: AbortSignal;
  timeoutMs?: number;
  throwOnHttpError?: boolean;
  logger?: RequestLoggerConfig;
}

export interface ClientConfig {
  baseUrl?: string;
  headers?: HeadersInit;
  timeoutMs?: number;
  throwOnHttpError?: boolean;
  logger?: RequestLoggerConfig;
}

export interface Client {
  request<TResponse = unknown, TBody = unknown>(
    config: RequestConfig<TBody>,
  ): Promise<RequestResult<TResponse>>;
  getRequest<TResponse = unknown>(
    url: string,
    config?: BodylessMethodConfig,
  ): Promise<RequestResult<TResponse>>;
  postRequest<TResponse = unknown, TBody = unknown>(
    url: string,
    config?: MethodConfig<TBody>,
  ): Promise<RequestResult<TResponse>>;
  putRequest<TResponse = unknown, TBody = unknown>(
    url: string,
    config?: MethodConfig<TBody>,
  ): Promise<RequestResult<TResponse>>;
  patchRequest<TResponse = unknown, TBody = unknown>(
    url: string,
    config?: MethodConfig<TBody>,
  ): Promise<RequestResult<TResponse>>;
  deleteRequest<TResponse = unknown>(
    url: string,
    config?: BodylessMethodConfig,
  ): Promise<RequestResult<TResponse>>;
  headRequest<TResponse = unknown>(
    url: string,
    config?: BodylessMethodConfig,
  ): Promise<RequestResult<TResponse>>;
  optionsRequest<TResponse = unknown>(
    url: string,
    config?: BodylessMethodConfig,
  ): Promise<RequestResult<TResponse>>;
}

export function createClient(config: ClientConfig = {}): Client {
  const clientRequest = <TResponse = unknown, TBody = unknown>(
    requestConfig: RequestConfig<TBody>,
  ) => request<TResponse, TBody>(mergeClientConfig(config, requestConfig));

  return {
    request: clientRequest,
    getRequest: <TResponse = unknown>(
      url: string,
      requestConfig: BodylessMethodConfig = {},
    ) =>
      clientRequest<TResponse>({
        ...requestConfig,
        method: "GET",
        url,
      }),
    postRequest: <TResponse = unknown, TBody = unknown>(
      url: string,
      requestConfig: MethodConfig<TBody> = {},
    ) =>
      clientRequest<TResponse, TBody>({
        ...requestConfig,
        method: "POST",
        url,
      }),
    putRequest: <TResponse = unknown, TBody = unknown>(
      url: string,
      requestConfig: MethodConfig<TBody> = {},
    ) =>
      clientRequest<TResponse, TBody>({
        ...requestConfig,
        method: "PUT",
        url,
      }),
    patchRequest: <TResponse = unknown, TBody = unknown>(
      url: string,
      requestConfig: MethodConfig<TBody> = {},
    ) =>
      clientRequest<TResponse, TBody>({
        ...requestConfig,
        method: "PATCH",
        url,
      }),
    deleteRequest: <TResponse = unknown>(
      url: string,
      requestConfig: BodylessMethodConfig = {},
    ) =>
      clientRequest<TResponse>({
        ...requestConfig,
        method: "DELETE",
        url,
      }),
    headRequest: <TResponse = unknown>(
      url: string,
      requestConfig: BodylessMethodConfig = {},
    ) =>
      clientRequest<TResponse>({
        ...requestConfig,
        method: "HEAD",
        url,
      }),
    optionsRequest: <TResponse = unknown>(
      url: string,
      requestConfig: BodylessMethodConfig = {},
    ) =>
      clientRequest<TResponse>({
        ...requestConfig,
        method: "OPTIONS",
        url,
      }),
  };
}

export async function request<TResponse = unknown, TBody = unknown>(
  config: RequestConfig<TBody>,
): Promise<RequestResult<TResponse>> {
  const url = new URL(config.url);

  if (config.params) {
    for (const [key, value] of Object.entries(config.params)) {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v != null) url.searchParams.append(key, String(v));
        });
      } else if (value != null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers = mergeHeaders(
    {
      Accept: "application/json",
      ...(config.body == null ? {} : { "Content-Type": "application/json" }),
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
      body: config.body == null ? undefined : JSON.stringify(config.body),
      signal: createRequestSignal(config.signal, config.timeoutMs),
    });

    responseBody = await parseResponseBody<TResponse>(response, url.toString());

    await logResponse(config.logger, {
      method: config.method,
      url: logUrl,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      redirected: response.redirected,
      type: response.type,
      headers: redactHeaders(Object.fromEntries(response.headers.entries())),
      body: redactBody(responseBody),
    });

    if (!response.ok && config.throwOnHttpError !== false) {
      throw new HttpRequestError<TResponse>({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
        url: response.url || url.toString(),
      });
    }

    return {
      response,
      body: responseBody,
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

export function getRequest<TResponse = unknown>(
  url: string,
  config: BodylessMethodConfig = {},
): Promise<RequestResult<TResponse>> {
  return request<TResponse>({
    ...config,
    method: "GET",
    url,
  });
}

export function postRequest<TResponse = unknown, TBody = unknown>(
  url: string,
  config: MethodConfig<TBody> = {},
): Promise<RequestResult<TResponse>> {
  return request<TResponse, TBody>({
    ...config,
    method: "POST",
    url,
  });
}

export function putRequest<TResponse = unknown, TBody = unknown>(
  url: string,
  config: MethodConfig<TBody> = {},
): Promise<RequestResult<TResponse>> {
  return request<TResponse, TBody>({
    ...config,
    method: "PUT",
    url,
  });
}

export function patchRequest<TResponse = unknown, TBody = unknown>(
  url: string,
  config: MethodConfig<TBody> = {},
): Promise<RequestResult<TResponse>> {
  return request<TResponse, TBody>({
    ...config,
    method: "PATCH",
    url,
  });
}

export function deleteRequest<TResponse = unknown>(
  url: string,
  config: BodylessMethodConfig = {},
): Promise<RequestResult<TResponse>> {
  return request<TResponse>({
    ...config,
    method: "DELETE",
    url,
  });
}

export function headRequest<TResponse = unknown>(
  url: string,
  config: BodylessMethodConfig = {},
): Promise<RequestResult<TResponse>> {
  return request<TResponse>({
    ...config,
    method: "HEAD",
    url,
  });
}

export function optionsRequest<TResponse = unknown>(
  url: string,
  config: BodylessMethodConfig = {},
): Promise<RequestResult<TResponse>> {
  return request<TResponse>({
    ...config,
    method: "OPTIONS",
    url,
  });
}

async function parseResponseBody<TResponse>(
  response: Response,
  requestUrl: string,
): Promise<TResponse> {
  const text = await response.text();

  if (!text) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text) as TResponse;
    } catch (error) {
      throw new InvalidJsonResponseError({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: text,
        url: response.url || requestUrl,
        cause: error,
      });
    }
  }

  return text as TResponse;
}

function createRequestSignal(
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

function mergeClientConfig<TBody>(
  clientConfig: ClientConfig,
  requestConfig: RequestConfig<TBody>,
): RequestConfig<TBody> {
  return {
    ...requestConfig,
    url: resolveClientUrl(requestConfig.url, clientConfig.baseUrl),
    headers: mergeHeaders(clientConfig.headers, requestConfig.headers),
    timeoutMs: requestConfig.timeoutMs ?? clientConfig.timeoutMs,
    throwOnHttpError:
      requestConfig.throwOnHttpError ?? clientConfig.throwOnHttpError,
    logger: requestConfig.logger ?? clientConfig.logger,
  };
}

function resolveClientUrl(url: string, baseUrl: string | undefined) {
  if (!baseUrl || isAbsoluteUrl(url)) {
    return url;
  }

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedUrl = url.replace(/^\/+/, "");

  return new URL(normalizedUrl, normalizedBaseUrl).toString();
}

function isAbsoluteUrl(url: string) {
  return /^[a-z][a-z\d+\-.]*:/i.test(url);
}

function mergeHeaders(
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
