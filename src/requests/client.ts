import { customRequest } from "./customRequest.js";
import { mergeHeaders, resolveClientUrl } from "./internals.js";
import type {
  BodylessMethodConfig,
  Client,
  ClientConfig,
  MethodConfig,
  RequestConfig,
} from "./types.js";

export function createClient(config: ClientConfig = {}): Client {
  const clientRequest = <TResponse = unknown, TBody = unknown>(
    requestConfig: RequestConfig<TBody>,
  ) => customRequest<TResponse, TBody>(mergeClientConfig(config, requestConfig));

  return {
    customRequest: clientRequest,
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
    responseType: requestConfig.responseType ?? clientConfig.responseType,
    logger: requestConfig.logger ?? clientConfig.logger,
  };
}
