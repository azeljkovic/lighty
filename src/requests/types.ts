import type { HttpMethod } from "../types.js";
import type { RequestLoggerConfig } from "../utils/logger.js";

export type RequestParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;
export type RequestParams = Record<string, RequestParamValue>;
export type RequestResponseType =
  | "json"
  | "text"
  | "arrayBuffer"
  | "blob"
  | "stream"
  | "none";
export type RequestRedirectMode = "error" | "follow" | "manual";

/**
 * Converts a parsed response body to the type used by the request result.
 * Use this for runtime validation as well as transformation.
 */
export type ResponseParser<TResponse> = (
  body: unknown,
  response: Response,
) => TResponse | Promise<TResponse>;

/**
 * The shape implemented by schema libraries such as Zod and Valibot.
 */
export interface ResponseSchema<TResponse> {
  parse(body: unknown): TResponse | Promise<TResponse>;
}

export type ResponseParserHook<TResponse> =
  | ResponseParser<TResponse>
  | ResponseSchema<TResponse>;

export interface RequestResult<TResponse = unknown> {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  data: TResponse;
  response: Response;
}

export interface RequestConfig<TBody = unknown, TResponse = unknown> {
  method: HttpMethod;
  url: string;
  headers?: HeadersInit;
  params?: RequestParams;
  body?: TBody;
  signal?: AbortSignal;
  timeoutMs?: number;
  throwOnHttpError?: boolean;
  responseType?: RequestResponseType;
  responseParser?: ResponseParserHook<TResponse>;
  redirect?: RequestRedirectMode;
  logger?: RequestLoggerConfig;
}

export interface MethodConfig<TBody = unknown, TResponse = unknown> {
  headers?: HeadersInit;
  params?: RequestParams;
  body?: TBody;
  signal?: AbortSignal;
  timeoutMs?: number;
  throwOnHttpError?: boolean;
  responseType?: RequestResponseType;
  responseParser?: ResponseParserHook<TResponse>;
  redirect?: RequestRedirectMode;
  logger?: RequestLoggerConfig;
}

export type BodylessMethodConfig<TResponse = unknown> = Omit<
  MethodConfig<never, TResponse>,
  "body"
>;

export interface ClientConfig<TResponse = unknown> {
  baseUrl?: string;
  headers?: HeadersInit;
  timeoutMs?: number;
  throwOnHttpError?: boolean;
  responseType?: RequestResponseType;
  responseParser?: ResponseParserHook<TResponse>;
  redirect?: RequestRedirectMode;
  logger?: RequestLoggerConfig;
}

export interface Client<TDefaultResponse = unknown> {
  customRequest<TResponse = TDefaultResponse, TBody = unknown>(
    config: RequestConfig<TBody, TResponse>,
  ): Promise<RequestResult<TResponse>>;
  getRequest<TResponse = TDefaultResponse>(
    url: string,
    config?: BodylessMethodConfig<TResponse>,
  ): Promise<RequestResult<TResponse>>;
  postRequest<TResponse = TDefaultResponse, TBody = unknown>(
    url: string,
    config?: MethodConfig<TBody, TResponse>,
  ): Promise<RequestResult<TResponse>>;
  putRequest<TResponse = TDefaultResponse, TBody = unknown>(
    url: string,
    config?: MethodConfig<TBody, TResponse>,
  ): Promise<RequestResult<TResponse>>;
  patchRequest<TResponse = TDefaultResponse, TBody = unknown>(
    url: string,
    config?: MethodConfig<TBody, TResponse>,
  ): Promise<RequestResult<TResponse>>;
  deleteRequest<TResponse = TDefaultResponse>(
    url: string,
    config?: BodylessMethodConfig<TResponse>,
  ): Promise<RequestResult<TResponse>>;
  headRequest<TResponse = TDefaultResponse>(
    url: string,
    config?: BodylessMethodConfig<TResponse>,
  ): Promise<RequestResult<TResponse>>;
  optionsRequest<TResponse = TDefaultResponse>(
    url: string,
    config?: BodylessMethodConfig<TResponse>,
  ): Promise<RequestResult<TResponse>>;
}
