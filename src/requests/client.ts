import { customRequest } from "./customRequest.js";
import { mergeHeaders, resolveClientUrl } from "./internals.js";
import type {
  BodylessMethodConfig,
  Client,
  ClientConfig,
  MethodConfig,
  RequestConfig,
  ResponseParserHook,
} from "./types.js";

export function createClient<TDefaultResponse = unknown>(
  config: ClientConfig<TDefaultResponse> = {},
): Client<TDefaultResponse> {
  const clientRequest = <TResponse = TDefaultResponse, TBody = unknown>(
    requestConfig: RequestConfig<TBody, TResponse>,
  ) =>
    customRequest<TResponse, TBody>(mergeClientConfig(config, requestConfig));

  return {
    customRequest: clientRequest,
    getRequest: <TResponse = TDefaultResponse>(
      url: string,
      requestConfig: BodylessMethodConfig<TResponse> = {},
    ) =>
      clientRequest<TResponse>({
        ...requestConfig,
        method: "GET",
        url,
      }),
    postRequest: <TResponse = TDefaultResponse, TBody = unknown>(
      url: string,
      requestConfig: MethodConfig<TBody, TResponse> = {},
    ) =>
      clientRequest<TResponse, TBody>({
        ...requestConfig,
        method: "POST",
        url,
      }),
    putRequest: <TResponse = TDefaultResponse, TBody = unknown>(
      url: string,
      requestConfig: MethodConfig<TBody, TResponse> = {},
    ) =>
      clientRequest<TResponse, TBody>({
        ...requestConfig,
        method: "PUT",
        url,
      }),
    patchRequest: <TResponse = TDefaultResponse, TBody = unknown>(
      url: string,
      requestConfig: MethodConfig<TBody, TResponse> = {},
    ) =>
      clientRequest<TResponse, TBody>({
        ...requestConfig,
        method: "PATCH",
        url,
      }),
    deleteRequest: <TResponse = TDefaultResponse>(
      url: string,
      requestConfig: BodylessMethodConfig<TResponse> = {},
    ) =>
      clientRequest<TResponse>({
        ...requestConfig,
        method: "DELETE",
        url,
      }),
    headRequest: <TResponse = TDefaultResponse>(
      url: string,
      requestConfig: BodylessMethodConfig<TResponse> = {},
    ) =>
      clientRequest<TResponse>({
        ...requestConfig,
        method: "HEAD",
        url,
      }),
    optionsRequest: <TResponse = TDefaultResponse>(
      url: string,
      requestConfig: BodylessMethodConfig<TResponse> = {},
    ) =>
      clientRequest<TResponse>({
        ...requestConfig,
        method: "OPTIONS",
        url,
      }),
  };
}

function mergeClientConfig<TBody, TResponse>(
  clientConfig: ClientConfig,
  requestConfig: RequestConfig<TBody, TResponse>,
): RequestConfig<TBody, TResponse> {
  return {
    ...requestConfig,
    url: resolveClientUrl(requestConfig.url, clientConfig.baseUrl),
    headers: mergeHeaders(clientConfig.headers, requestConfig.headers),
    timeoutMs: requestConfig.timeoutMs ?? clientConfig.timeoutMs,
    throwOnHttpError:
      requestConfig.throwOnHttpError ?? clientConfig.throwOnHttpError,
    responseType: requestConfig.responseType ?? clientConfig.responseType,
    responseParser:
      requestConfig.responseParser ??
      (clientConfig.responseParser as
        | ResponseParserHook<TResponse>
        | undefined),
    redirect: requestConfig.redirect ?? clientConfig.redirect,
    logger: requestConfig.logger ?? clientConfig.logger,
  };
}
