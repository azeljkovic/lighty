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
  bodyArrayIsEmpty,
  bodyArrayIsNotEmpty,
  bodyArrayLengthIs,
  bodyEquals,
  bodyHasProperty,
  bodyIncludesProperties,
  bodyIsArray,
  bodyIsEmpty,
  bodyIsNoContent,
  bodyMatches,
  bodyObjectIsEmpty,
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
  bodyArrayIsEmpty,
  bodyArrayIsNotEmpty,
  bodyArrayLengthIs,
  bodyEquals,
  bodyHasProperty,
  bodyIncludesProperties,
  bodyIsArray,
  bodyIsEmpty,
  bodyIsNoContent,
  bodyMatches,
  bodyObjectIsEmpty,
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
  bodyArrayIsEmpty,
  bodyArrayIsNotEmpty,
  bodyArrayLengthIs,
  bodyEquals,
  bodyHasProperty,
  bodyIncludesProperties,
  bodyIsArray,
  bodyIsEmpty,
  bodyIsNoContent,
  bodyMatches,
  bodyObjectIsEmpty,
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
  RequestResponseType,
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
