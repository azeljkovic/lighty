import * as assert from "node:assert";
import { getResponse, type ResponseAssertionTarget } from "./targets.js";

export function headerExists(
  response: ResponseAssertionTarget,
  headerName: string,
) {
  const actual = getResponse(response);

  assert.ok(
    actual.headers.has(headerName),
    `Expected response header "${headerName}" to exist`,
  );
}

export function headerIs(
  response: ResponseAssertionTarget,
  headerName: string,
  expectedValue: string,
) {
  const actual = getResponse(response);

  assert.strictEqual(
    actual.headers.get(headerName),
    expectedValue,
    `Response header "${headerName}" did not match the expected value`,
  );
}

export function headerIncludes(
  response: ResponseAssertionTarget,
  headerName: string,
  expectedValue: string,
) {
  const actual = getResponse(response);
  const headerValue = actual.headers.get(headerName);

  assert.ok(
    headerValue?.includes(expectedValue),
    `Response header "${headerName}" did not include "${expectedValue}", received "${headerValue}"`,
  );
}

export function contentTypeIsJson(response: ResponseAssertionTarget) {
  headerIncludes(response, "content-type", "application/json");
}
