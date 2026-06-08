import * as assert from "node:assert";
import { isDeepStrictEqual } from "node:util";
import type { RequestResult } from "../requests/index.js";
import {
  assertionErrorWithCause,
  formatThrown,
  formatValue,
} from "./format.js";
import { getBody, type BodyAssertionTarget } from "./targets.js";

type PathPart = string | number;
type DeepPartial<T> = T extends Array<infer TItem>
  ? Array<DeepPartial<TItem>>
  : T extends object
    ? { [TKey in keyof T]?: DeepPartial<T[TKey]> }
    : T;

export function bodyEquals<TBody>(
  actualBody: BodyAssertionTarget<TBody>,
  expectedBody: TBody,
) {
  const body = getBody(actualBody);

  assert.deepStrictEqual(
    body,
    expectedBody,
    `Response body did not match the expected body; expected ${formatValue(expectedBody)}, received ${formatValue(body)}`,
  );
}

export function bodyContains<TBody>(
  actualBody: BodyAssertionTarget<TBody>,
  expectedPartial: DeepPartial<TBody>,
) {
  const body = getBody(actualBody);

  assert.ok(
    deepPartialMatches(body, expectedPartial),
    `Response body did not contain the expected partial body; expected partial ${formatValue(expectedPartial)}, received ${formatValue(body)}`,
  );
}

export function bodyTextContains(
  actualBody: BodyAssertionTarget<string>,
  expectedText: string,
) {
  const body = getBody(actualBody);

  assert.ok(
    typeof body === "string",
    `Expected response body to be text; received ${formatValue(body)}`,
  );
  assert.ok(
    body.includes(expectedText),
    `Expected response body text to contain ${formatValue(expectedText)}; received ${formatValue(body)}`,
  );
}

export function bodyTextMatches(
  actualBody: BodyAssertionTarget<string>,
  expectedText: string,
) {
  const body = getBody(actualBody);

  assert.ok(
    typeof body === "string",
    `Expected response body to be text; received ${formatValue(body)}`,
  );
  assert.strictEqual(
    body,
    expectedText,
    `Response body text did not match the expected text; expected ${formatValue(expectedText)}, received ${formatValue(body)}`,
  );
}

export function bodyHasProperty<TBody extends Record<string, unknown>>(
  actualBody: BodyAssertionTarget<TBody>,
  propertyName: keyof TBody,
  expectedValue?: TBody[keyof TBody],
) {
  const body = getBody(actualBody);
  assertBodyIsObject(body);

  assert.ok(
    Object.hasOwn(body, propertyName),
    `Expected response body to include property "${String(propertyName)}"; available properties: ${formatAvailablePropertyNames(body)}; received ${formatValue(body)}`,
  );

  if (arguments.length === 3) {
    const actualValue = body[propertyName];

    assert.deepStrictEqual(
      actualValue,
      expectedValue,
      `Response body property "${String(propertyName)}" did not match the expected value; expected ${formatValue(expectedValue)}, received ${formatValue(actualValue)}`,
    );
  }
}

export function bodyPathEquals<TExpected>(
  actualBody: BodyAssertionTarget<unknown>,
  path: string | readonly PathPart[],
  expectedValue: TExpected,
) {
  const actualValue = getValueAtPath(getBody(actualBody), parsePath(path));

  assert.deepStrictEqual(
    actualValue,
    expectedValue,
    `Response body path "${formatPath(path)}" did not match the expected value; expected ${formatValue(expectedValue)}, received ${formatValue(actualValue)}`,
  );
}

export function bodyIncludesProperties<TBody extends Record<string, unknown>>(
  actualBody: BodyAssertionTarget<TBody>,
  expectedProperties: Partial<TBody>,
) {
  const body = getBody(actualBody);
  assertBodyIsObject(body);

  for (const [propertyName, expectedValue] of Object.entries(
    expectedProperties,
  )) {
    assert.ok(
      Object.hasOwn(body, propertyName),
      `Expected response body to include property "${propertyName}"; available properties: ${formatAvailablePropertyNames(body)}; received ${formatValue(body)}`,
    );

    const actualValue = body[propertyName];

    assert.deepStrictEqual(
      actualValue,
      expectedValue,
      `Response body property "${propertyName}" did not match the expected value; expected ${formatValue(expectedValue)}, received ${formatValue(actualValue)}`,
    );
  }
}

export function bodyIsArray<TItem = unknown>(
  actualBody: BodyAssertionTarget<unknown>,
): asserts actualBody is TItem[] | RequestResult<TItem[]> {
  assert.ok(
    Array.isArray(getBody(actualBody)),
    `Expected response body to be an array; received ${formatValue(getBody(actualBody))}`,
  );
}

export function bodyArrayLengthIs<TItem = unknown>(
  actualBody: BodyAssertionTarget<TItem[]>,
  expectedLength: number,
) {
  bodyIsArray<TItem>(actualBody);
  const body = getBody(actualBody);

  assert.strictEqual(
    body.length,
    expectedLength,
    `Response body array length did not match ${expectedLength}; received length ${body.length}`,
  );
}

export function bodyArrayContains<TItem = unknown>(
  actualBody: BodyAssertionTarget<TItem[]>,
  expectedItem: TItem,
) {
  bodyIsArray<TItem>(actualBody);
  const body = getBody(actualBody);

  assert.ok(
    body.some((item) => isDeepStrictEqual(item, expectedItem)),
    `Expected response body array to contain ${formatValue(expectedItem)}; received ${formatValue(body)}`,
  );
}

export function bodyArrayContainsItemMatching<TItem = unknown>(
  actualBody: BodyAssertionTarget<TItem[]>,
  predicate: (item: TItem) => boolean,
  message = "Expected response body array to contain an item matching the expected condition",
) {
  bodyIsArray<TItem>(actualBody);
  const body = getBody(actualBody);

  for (const [index, item] of body.entries()) {
    let passed: boolean;
    try {
      passed = predicate(item);
    } catch (error) {
      throw assertionErrorWithCause({
        actual: item,
        cause: error,
        expected: true,
        message: `Response body array predicate threw at index ${index} while evaluating received item ${formatValue(item)}: ${formatThrown(error)}`,
        operator: "bodyArrayContainsItemMatching predicate",
        stackStartFn: bodyArrayContainsItemMatching,
      });
    }

    if (passed) {
      return;
    }
  }

  assert.fail(`${message}; received ${formatValue(body)}`);
}

export function bodyArrayIsNotEmpty<TItem = unknown>(
  actualBody: BodyAssertionTarget<TItem[]>,
) {
  bodyIsArray<TItem>(actualBody);
  const body = getBody(actualBody);

  assert.ok(
    body.length > 0,
    `Expected response body array to contain at least one item; received length ${body.length}`,
  );
}

export function bodyArrayIsEmpty<TItem = unknown>(
  actualBody: BodyAssertionTarget<TItem[]>,
) {
  bodyIsArray<TItem>(actualBody);
  const body = getBody(actualBody);

  assert.strictEqual(
    body.length,
    0,
    `Expected response body array to be empty; received length ${body.length}`,
  );
}

export function bodyHasLength(
  actualBody: BodyAssertionTarget<{ length: number }>,
  expectedLength: number,
) {
  const body = getBody(actualBody);

  assertHasLength(body);
  assert.strictEqual(
    body.length,
    expectedLength,
    `Response body length did not match ${expectedLength}; received length ${body.length}`,
  );
}

export function bodyLengthIsGreaterThan(
  actualBody: BodyAssertionTarget<{ length: number }>,
  expectedMinimumLength: number,
) {
  const body = getBody(actualBody);

  assertHasLength(body);
  assert.ok(
    body.length > expectedMinimumLength,
    `Expected response body length to be greater than ${expectedMinimumLength}; received length ${body.length}`,
  );
}

export function bodyLengthIsAtLeast(
  actualBody: BodyAssertionTarget<{ length: number }>,
  expectedMinimumLength: number,
) {
  const body = getBody(actualBody);

  assertHasLength(body);
  assert.ok(
    body.length >= expectedMinimumLength,
    `Expected response body length to be at least ${expectedMinimumLength}; received length ${body.length}`,
  );
}

export function bodyObjectIsEmpty(
  actualBody: BodyAssertionTarget<unknown>,
): asserts actualBody is
  | Record<string, never>
  | RequestResult<Record<string, never>> {
  const body = getBody(actualBody);

  assert.ok(
    isObjectBody(body),
    `Expected response body to be a non-array object; received ${formatValue(body)}`,
  );
  assert.deepStrictEqual(
    Object.keys(body),
    [],
    `Expected response body object to be empty; received properties: ${formatAvailablePropertyNames(body)}`,
  );
}

/**
 * Passes for response bodies that represent no payload: null, undefined, or "".
 * Use responseIsNoContent to assert a 204 response status.
 */
export function bodyIsNoContent(actualBody: BodyAssertionTarget<unknown>) {
  const body = getBody(actualBody);

  assert.ok(
    body == null || body === "",
    `Expected response body to have no content; received ${formatValue(body)}`,
  );
}

export function bodyMatches<TBody>(
  actualBody: BodyAssertionTarget<TBody>,
  predicate: (body: TBody) => boolean,
  message = "Response body did not match the expected condition",
) {
  const body = getBody(actualBody);

  let passed: boolean;
  try {
    passed = predicate(body);
  } catch (error) {
    throw assertionErrorWithCause({
      actual: body,
      cause: error,
      expected: true,
      message: `Response body predicate threw while evaluating received body ${formatValue(body)}: ${formatThrown(error)}`,
      operator: "bodyMatches predicate",
      stackStartFn: bodyMatches,
    });
  }

  assert.ok(passed, `${message}; received ${formatValue(body)}`);
}

function assertBodyIsObject(
  body: unknown,
): asserts body is Record<PropertyKey, unknown> {
  assert.ok(
    typeof body === "object" && body !== null,
    `Expected response body to be a non-null object; received ${formatValue(body)}`,
  );
}

function assertHasLength(body: unknown): asserts body is { length: number } {
  assert.ok(
    hasLength(body),
    `Expected response body to have a numeric length property; received ${formatValue(body)}`,
  );
}

function deepPartialMatches(actual: unknown, expectedPartial: unknown): boolean {
  if (isObjectBody(expectedPartial)) {
    if (!isObjectBody(actual)) {
      return false;
    }

    return Object.entries(expectedPartial).every(([key, expectedValue]) =>
      deepPartialMatches(actual[key], expectedValue),
    );
  }

  if (Array.isArray(expectedPartial)) {
    if (!Array.isArray(actual) || actual.length < expectedPartial.length) {
      return false;
    }

    return expectedPartial.every((expectedItem, index) =>
      deepPartialMatches(actual[index], expectedItem),
    );
  }

  return Object.is(actual, expectedPartial);
}

function getValueAtPath(body: unknown, pathParts: readonly PathPart[]): unknown {
  return pathParts.reduce<unknown>((currentValue, pathPart) => {
    if (currentValue == null) {
      return undefined;
    }

    if (typeof pathPart === "number") {
      return Array.isArray(currentValue) ? currentValue[pathPart] : undefined;
    }

    if (typeof currentValue !== "object") {
      return undefined;
    }

    return (currentValue as Record<string, unknown>)[pathPart];
  }, body);
}

function parsePath(path: string | readonly PathPart[]): PathPart[] {
  if (typeof path !== "string") {
    assert.ok(path.length > 0, "Expected response body path to be non-empty");
    return [...path];
  }

  assert.ok(path.length > 0, "Expected response body path to be non-empty");

  const parts: PathPart[] = [];
  let index = path.startsWith("$") ? 1 : 0;

  while (index < path.length) {
    const char = path[index];

    if (char === ".") {
      index += 1;
      continue;
    }

    if (char === "[") {
      const result = parseBracketPathPart(path, index);
      parts.push(result.part);
      index = result.endIndex;
      continue;
    }

    const startIndex = index;
    while (index < path.length && path[index] !== "." && path[index] !== "[") {
      index += 1;
    }
    const part = path.slice(startIndex, index);
    assert.ok(part.length > 0, `Invalid response body path "${path}"`);
    parts.push(part);
  }

  assert.ok(parts.length > 0, "Expected response body path to be non-empty");

  return parts;
}

function parseBracketPathPart(
  path: string,
  startIndex: number,
): { part: PathPart; endIndex: number } {
  const closeIndex = path.indexOf("]", startIndex + 1);

  assert.ok(closeIndex > startIndex, `Invalid response body path "${path}"`);

  const rawPart = path.slice(startIndex + 1, closeIndex).trim();

  assert.ok(rawPart.length > 0, `Invalid response body path "${path}"`);

  if (/^\d+$/.test(rawPart)) {
    return { part: Number(rawPart), endIndex: closeIndex + 1 };
  }

  const quote = rawPart[0];
  if (
    (quote === `"` || quote === `'`) &&
    rawPart.endsWith(quote) &&
    rawPart.length >= 2
  ) {
    return { part: rawPart.slice(1, -1), endIndex: closeIndex + 1 };
  }

  return { part: rawPart, endIndex: closeIndex + 1 };
}

function formatPath(path: string | readonly PathPart[]): string {
  return typeof path === "string" ? path : path.join(".");
}

function hasLength(body: unknown): body is { length: number } {
  if (typeof body === "string" || Array.isArray(body)) {
    return true;
  }

  return (
    typeof body === "object" &&
    body !== null &&
    "length" in body &&
    typeof body.length === "number"
  );
}

function isObjectBody(body: unknown): body is Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

function formatAvailablePropertyNames(
  body: Record<PropertyKey, unknown>,
): string {
  const propertyNames = Reflect.ownKeys(body);

  if (propertyNames.length === 0) {
    return "none";
  }

  return propertyNames.map((propertyName) => formatValue(propertyName)).join(", ");
}
