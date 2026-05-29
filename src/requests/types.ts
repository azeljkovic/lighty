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

export interface RequestResult<TResponse = unknown> {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  data: TResponse;
  response: Response;
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
  responseType?: RequestResponseType;
  logger?: RequestLoggerConfig;
}

export interface MethodConfig<TBody = unknown> {
  headers?: HeadersInit;
  params?: RequestParams;
  body?: TBody;
  signal?: AbortSignal;
  timeoutMs?: number;
  throwOnHttpError?: boolean;
  responseType?: RequestResponseType;
  logger?: RequestLoggerConfig;
}

export type BodylessMethodConfig = Omit<MethodConfig, "body">;

export interface ClientConfig {
  baseUrl?: string;
  headers?: HeadersInit;
  timeoutMs?: number;
  throwOnHttpError?: boolean;
  responseType?: RequestResponseType;
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
