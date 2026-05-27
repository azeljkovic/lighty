import {
  createClient,
  deleteRequest,
  getRequest,
  headRequest,
  HttpRequestError,
  InvalidJsonResponseError,
  optionsRequest,
  patchRequest,
  postRequest,
  putRequest,
  request,
} from "./requests/rq.js";

import {
  bodyArrayIsNotEmpty,
  bodyArrayLengthIs,
  bodyEquals,
  bodyHasProperty,
  bodyIncludesProperties,
  bodyIsArray,
  bodyIsEmpty,
  bodyMatches,
} from "./assertions/body.js";

import {
  contentTypeIsJson,
  headerExists,
  headerIncludes,
  headerIs,
} from "./assertions/headers.js";

import {
  responseIsBadRequest,
  responseIsCreated,
  responseIsForbidden,
  responseIsNoContent,
  responseIsNotFound,
  responseIsOk,
  responseIsServerError,
  responseIsUnauthorized,
  statusCodeIs,
  statusCodeIsInRange,
  statusCodeIsOneOf,
} from "./assertions/response.js";

export {
  createClient,
  deleteRequest,
  getRequest,
  headRequest,
  HttpRequestError,
  InvalidJsonResponseError,
  optionsRequest,
  patchRequest,
  postRequest,
  putRequest,
  request,
};

export {
  bodyArrayIsNotEmpty,
  bodyArrayLengthIs,
  bodyEquals,
  bodyHasProperty,
  bodyIncludesProperties,
  bodyIsArray,
  bodyIsEmpty,
  bodyMatches,
};

export { contentTypeIsJson, headerExists, headerIncludes, headerIs };

export {
  responseIsBadRequest,
  responseIsCreated,
  responseIsForbidden,
  responseIsNoContent,
  responseIsNotFound,
  responseIsOk,
  responseIsServerError,
  responseIsUnauthorized,
  statusCodeIs,
  statusCodeIsInRange,
  statusCodeIsOneOf,
};

export const lightyRequest = {
  createClient,
  deleteRequest,
  getRequest,
  headRequest,
  HttpRequestError,
  InvalidJsonResponseError,
  optionsRequest,
  patchRequest,
  postRequest,
  putRequest,
  request,
};

export const lightyAssert = {
  bodyArrayIsNotEmpty,
  bodyArrayLengthIs,
  bodyEquals,
  bodyHasProperty,
  bodyIncludesProperties,
  bodyIsArray,
  bodyIsEmpty,
  bodyMatches,
  contentTypeIsJson,
  headerExists,
  headerIncludes,
  headerIs,
  responseIsBadRequest,
  responseIsCreated,
  responseIsForbidden,
  responseIsNoContent,
  responseIsNotFound,
  responseIsOk,
  responseIsServerError,
  responseIsUnauthorized,
  statusCodeIs,
  statusCodeIsInRange,
  statusCodeIsOneOf,
};

export type {
  Client,
  ClientConfig,
  InvalidJsonResponseErrorOptions,
  MethodConfig,
  RequestConfig,
  RequestResult,
} from "./requests/rq.js";
export type { HttpRequestErrorOptions } from "./requests/rq.js";
export type {
  RequestEndLogEntry,
  RequestLogger,
  RequestLoggerConfig,
  RequestLoggerLevel,
  RequestStartLogEntry,
  ResponseLogEntry,
} from "./utils/logger.js";
export type { Body, BodyParseError, HttpMethod } from "./types.js";
