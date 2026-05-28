import * as assert from "node:assert";
import {
  assertionErrorWithCause,
  formatThrown,
  formatValue,
} from "./format.js";
import { getResponse, type ResponseAssertionTarget } from "./targets.js";

export function headerExists(
  response: ResponseAssertionTarget,
  headerName: string,
) {
  const actual = getResponse(response);

  assert.ok(
    actual.headers.has(headerName),
    missingHeaderMessage(actual.headers, headerName),
  );
}

export function headerIs(
  response: ResponseAssertionTarget,
  headerName: string,
  expectedValue: string,
) {
  const actual = getResponse(response);
  const headerValue = actual.headers.get(headerName);

  assert.strictEqual(
    headerValue,
    expectedValue,
    `Response header "${headerName}" did not match the expected value; expected ${formatValue(expectedValue)}, received ${formatHeaderValue(headerValue)}${formatAvailableHeadersSuffix(actual.headers)}`,
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
    `Response header "${headerName}" did not include ${formatValue(expectedValue)}; received ${formatHeaderValue(headerValue)}${formatAvailableHeadersSuffix(actual.headers)}`,
  );
}

export function headerMatches(
  response: ResponseAssertionTarget,
  headerName: string,
  expectedPattern: RegExp,
) {
  const actual = getResponse(response);
  const headerValue = actual.headers.get(headerName);

  expectedPattern.lastIndex = 0;

  assert.ok(
    headerValue != null && expectedPattern.test(headerValue),
    `Response header "${headerName}" did not match ${expectedPattern}; received ${formatHeaderValue(headerValue)}${formatAvailableHeadersSuffix(actual.headers)}`,
  );
}

export function headerSatisfies(
  response: ResponseAssertionTarget,
  headerName: string,
  predicate: (headerValue: string) => boolean,
  message = `Response header "${headerName}" did not match the expected condition`,
) {
  const actual = getResponse(response);
  const headerValue = actual.headers.get(headerName);

  assert.ok(
    headerValue != null,
    missingHeaderMessage(actual.headers, headerName),
  );

  let passed: boolean;
  try {
    passed = predicate(headerValue);
  } catch (error) {
    throw assertionErrorWithCause({
      actual: headerValue,
      cause: error,
      expected: true,
      message: `Response header "${headerName}" predicate threw while evaluating received value ${formatValue(headerValue)}: ${formatThrown(error)}`,
      operator: "headerSatisfies predicate",
      stackStartFn: headerSatisfies,
    });
  }

  assert.ok(
    passed,
    `${message}; received ${formatValue(headerValue)} for response header "${headerName}"`,
  );
}

export function contentTypeIsJson(response: ResponseAssertionTarget) {
  headerIncludes(response, "content-type", "application/json");
}

function missingHeaderMessage(headers: Headers, headerName: string): string {
  return `Expected response header "${headerName}" to exist; available headers: ${formatAvailableHeaderNames(headers)}`;
}

function formatHeaderValue(value: string | null): string {
  return value == null ? "missing" : formatValue(value);
}

function formatAvailableHeadersSuffix(headers: Headers): string {
  return `; available headers: ${formatAvailableHeaderNames(headers)}`;
}

function formatAvailableHeaderNames(headers: Headers): string {
  if (typeof headers.keys !== "function") {
    return "unknown";
  }

  const headerNames = Array.from(headers.keys());

  if (headerNames.length === 0) {
    return "none";
  }

  return headerNames.map((headerName) => formatValue(headerName)).join(", ");
}
