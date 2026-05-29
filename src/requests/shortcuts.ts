import { request } from "./request.js";
import type {
  BodylessMethodConfig,
  MethodConfig,
  RequestResult,
} from "./types.js";

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
