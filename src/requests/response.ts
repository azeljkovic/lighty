import { redactBody } from "../utils/logger.js";
import { InvalidJsonResponseError } from "./errors.js";
import type { RequestResponseType, ResponseParserHook } from "./types.js";

export async function parseResponseBody<TResponse>(
  response: Response,
  requestUrl: string,
  responseType?: RequestResponseType,
): Promise<TResponse> {
  if (responseType === "none") {
    return undefined as TResponse;
  }

  if (responseType === "stream") {
    return response.body as TResponse;
  }

  if (responseType === "arrayBuffer") {
    return (await response.arrayBuffer()) as TResponse;
  }

  if (responseType === "blob") {
    return (await response.blob()) as TResponse;
  }

  if (responseType === "text") {
    return (await response.text()) as TResponse;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (
    responseType === undefined &&
    contentType.includes("application/octet-stream")
  ) {
    return (await response.arrayBuffer()) as TResponse;
  }

  const text = await response.text();

  if (!text) {
    return undefined as TResponse;
  }

  if (responseType === "json" || isJsonContentType(contentType)) {
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

export async function applyResponseParser<TResponse>(
  body: unknown,
  response: Response,
  parser?: ResponseParserHook<TResponse>,
): Promise<TResponse> {
  if (parser === undefined) {
    return body as TResponse;
  }

  return typeof parser === "function"
    ? parser(body, response)
    : parser.parse(body);
}

function isJsonContentType(contentType: string): boolean {
  const mediaType = contentType.split(";", 1)[0].trim().toLowerCase();

  return mediaType === "application/json" || mediaType.endsWith("+json");
}

export function getLogResponseBody<TResponse>(
  body: TResponse,
  responseType?: RequestResponseType,
): unknown {
  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body);
  }

  if (body instanceof Blob) {
    return `[Blob ${body.size} bytes${body.type ? ` ${body.type}` : ""}]`;
  }

  if (responseType === "stream" && body != null) {
    return "[ReadableStream]";
  }

  return redactBody(body);
}
