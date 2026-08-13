import * as assert from "node:assert";
import type { RequestResult } from "../requests/index.js";

export type ResponseAssertionTarget = Response | RequestResult<unknown>;
export type BodyAssertionTarget<TBody = unknown> = TBody | RequestResult<TBody>;

export function getResponse(response: ResponseAssertionTarget): Response {
  assert.ok(
    isObjectLike(response),
    "Expected response assertion target to be a Response or a request result",
  );

  const actual = isRequestResult(response) ? response.response : response;

  assert.ok(
    isResponseLike(actual),
    "Expected response assertion target to be a Response or a request result",
  );

  return actual;
}

export function getBody<TBody>(body: BodyAssertionTarget<TBody>): TBody {
  return isRequestResult(body) ? body.data : body;
}

function isRequestResult<TBody>(
  value: BodyAssertionTarget<TBody>,
): value is RequestResult<TBody> {
  return (
    isObjectLike(value) &&
    "response" in value &&
    isResponseLike(value.response) &&
    "data" in value &&
    "status" in value &&
    typeof value.status === "number" &&
    "ok" in value &&
    typeof value.ok === "boolean" &&
    "headers" in value &&
    isHeadersRecord(value.headers)
  );
}

function isObjectLike(value: unknown): value is object {
  return (
    (typeof value === "object" || typeof value === "function") &&
    value !== null
  );
}

function isResponseLike(value: unknown): value is Response {
  if (!isObjectLike(value)) {
    return false;
  }

  return (
    "status" in value &&
    typeof value.status === "number" &&
    "headers" in value &&
    isHeadersLike(value.headers)
  );
}

function isHeadersLike(value: unknown): value is Headers {
  return (
    isObjectLike(value) &&
    "has" in value &&
    typeof value.has === "function" &&
    "get" in value &&
    typeof value.get === "function"
  );
}

function isHeadersRecord(value: unknown): value is Record<string, string> {
  return (
    isObjectLike(value) &&
    !Array.isArray(value) &&
    Object.values(value).every((header) => typeof header === "string")
  );
}
