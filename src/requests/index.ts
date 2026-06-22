export { createClient } from "./client.js";
export { HttpRequestError, InvalidJsonResponseError } from "./errors.js";
export { customRequest } from "./customRequest.js";
export {
  deleteRequest,
  getRequest,
  headRequest,
  optionsRequest,
  patchRequest,
  postRequest,
  putRequest,
} from "./shortcuts.js";

export type {
  BodylessMethodConfig,
  Client,
  ClientConfig,
  MethodConfig,
  RequestConfig,
  RequestParamValue,
  RequestParams,
  RequestRedirectMode,
  RequestResponseType,
  RequestResult,
} from "./types.js";
export type {
  HttpRequestErrorOptions,
  InvalidJsonResponseErrorOptions,
} from "./errors.js";
