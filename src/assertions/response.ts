import * as assert from "node:assert";
import { getResponse, type ResponseAssertionTarget } from "./targets.js";

export function responseIsOk(response: ResponseAssertionTarget) {
  const actual = getResponse(response);

  assert.ok(
    actual.status >= 200 && actual.status <= 299,
    `Response not ok (outside of range 200-299), received ${actual.status}`,
  );
}

export function responseIsCreated(response: ResponseAssertionTarget) {
  statusCodeIs(response, 201);
}

export function responseIsNoContent(response: ResponseAssertionTarget) {
  statusCodeIs(response, 204);
}

export function responseIsBadRequest(response: ResponseAssertionTarget) {
  statusCodeIs(response, 400);
}

export function responseIsUnauthorized(response: ResponseAssertionTarget) {
  statusCodeIs(response, 401);
}

export function responseIsForbidden(response: ResponseAssertionTarget) {
  statusCodeIs(response, 403);
}

export function responseIsNotFound(response: ResponseAssertionTarget) {
  statusCodeIs(response, 404);
}

export function responseIsServerError(response: ResponseAssertionTarget) {
  statusCodeIsInRange(response, 500, 599);
}

export function statusCodeIs(
  response: ResponseAssertionTarget,
  statusCode: number,
) {
  const actual = getResponse(response);

  assert.strictEqual(
    actual.status,
    statusCode,
    `Response status code ${actual.status} does not match the expected status code ${statusCode}`,
  );
}

export function statusCodeIsOneOf(
  response: ResponseAssertionTarget,
  statusCodes: number[],
) {
  const actual = getResponse(response);

  assert.ok(
    statusCodes.includes(actual.status),
    `Response status code ${actual.status} was not one of: ${statusCodes.join(", ")}`,
  );
}

export function statusCodeIsInRange(
  response: ResponseAssertionTarget,
  minStatusCode: number,
  maxStatusCode: number,
) {
  const actual = getResponse(response);

  assert.ok(
    actual.status >= minStatusCode && actual.status <= maxStatusCode,
    `Response status code ${actual.status} was not between ${minStatusCode} and ${maxStatusCode}`,
  );
}
