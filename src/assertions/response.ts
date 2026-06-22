import * as assert from "node:assert";
import { formatValue } from "./format.js";
import { getResponse, type ResponseAssertionTarget } from "./targets.js";

export function responseIsOk(response: ResponseAssertionTarget) {
  const actual = getResponse(response);

  assert.ok(
    actual.status >= 200 && actual.status <= 299,
    `Response not ok (outside of range 200-299), received ${formatResponseStatus(actual)}`,
  );
}

export function responseIsSuccessful(response: ResponseAssertionTarget) {
  statusCodeIs2xx(response);
}

export function responseIsRedirect(response: ResponseAssertionTarget) {
  statusCodeIs3xx(response);
}

export function responseWasRedirectedTo(
  response: ResponseAssertionTarget,
  url: string | URL,
) {
  const actual = getResponse(response);
  const expectedPathname = expectedRedirectPathname(url);

  assert.strictEqual(
    actual.redirected,
    true,
    `Response was not redirected to ${formatValue(expectedPathname)}`,
  );

  assert.ok(
    actual.url,
    `Response redirect target URL was empty; expected ${formatValue(expectedPathname)}`,
  );

  assert.strictEqual(
    new URL(actual.url, "http://lighty.local").pathname,
    expectedPathname,
    `Response redirect target ${formatValue(actual.url)} does not match the expected path ${formatValue(expectedPathname)}`,
  );
}

export function responseRedirectsTo(
  response: ResponseAssertionTarget,
  url: string | URL,
) {
  statusCodeIs3xx(response);

  const actual = getResponse(response);
  const location = actual.headers.get("location");
  const expectedPathname = expectedRedirectPathname(url);

  assert.ok(
    location,
    `Response redirect location header was empty; expected ${formatValue(expectedPathname)}`,
  );

  //The fake base URL, "http://lighty.local",
  // is only there so relative locations like "/get" can be parsed by URL.
  // It does not affect absolute redirect URLs.
  assert.strictEqual(
    new URL(location, "http://lighty.local").pathname,
    expectedPathname,
    `Response redirect location ${formatValue(location)} does not match the expected path ${formatValue(expectedPathname)}`,
  );
}

export function responseIsClientError(response: ResponseAssertionTarget) {
  statusCodeIs4xx(response);
}

export function responseIsCreated(response: ResponseAssertionTarget) {
  statusCodeIs(response, 201);
}

export function responseIsAccepted(response: ResponseAssertionTarget) {
  statusCodeIs(response, 202);
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

export function responseIsConflict(response: ResponseAssertionTarget) {
  statusCodeIs(response, 409);
}

export function responseIsUnprocessableEntity(
  response: ResponseAssertionTarget,
) {
  statusCodeIs(response, 422);
}

export function responseIsTooManyRequests(response: ResponseAssertionTarget) {
  statusCodeIs(response, 429);
}

export function responseIsServerError(response: ResponseAssertionTarget) {
  statusCodeIsInRange(response, 500, 599);
}

export function statusCodeIs2xx(response: ResponseAssertionTarget) {
  statusCodeIsInRange(response, 200, 299);
}

export function statusCodeIs3xx(response: ResponseAssertionTarget) {
  statusCodeIsInRange(response, 300, 399);
}

export function statusCodeIs4xx(response: ResponseAssertionTarget) {
  statusCodeIsInRange(response, 400, 499);
}

export function statusCodeIs5xx(response: ResponseAssertionTarget) {
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
    `Response status ${formatResponseStatus(actual)} does not match the expected status code ${statusCode}`,
  );
}

export function statusCodeIsOneOf(
  response: ResponseAssertionTarget,
  statusCodes: number[],
) {
  const actual = getResponse(response);

  assert.ok(
    statusCodes.includes(actual.status),
    `Response status ${formatResponseStatus(actual)} was not one of: ${statusCodes.join(", ")}`,
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
    `Response status ${formatResponseStatus(actual)} was not between ${minStatusCode} and ${maxStatusCode}`,
  );
}

function formatResponseStatus(response: Response): string {
  const parts = [String(response.status)];

  if (response.statusText) {
    parts.push(response.statusText);
  }

  if (response.url) {
    parts.push(`from ${formatValue(response.url)}`);
  }

  return parts.join(" ");
}

function expectedRedirectPathname(url: string | URL): string {
  return new URL(String(url), "http://lighty.local").pathname;
}
