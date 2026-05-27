import * as assert from "node:assert";
import type { RequestResult } from "../requests/rq.js";
import { getBody, type BodyAssertionTarget } from "./targets.js";

export function bodyEquals<TBody>(
  actualBody: BodyAssertionTarget<TBody>,
  expectedBody: TBody,
) {
  assert.deepStrictEqual(
    getBody(actualBody),
    expectedBody,
    "Response body did not match the expected body",
  );
}

export function bodyHasProperty<TBody extends Record<string, unknown>>(
  actualBody: BodyAssertionTarget<TBody>,
  propertyName: keyof TBody,
  expectedValue?: TBody[keyof TBody],
) {
  const body = getBody(actualBody);

  assert.ok(
    Object.hasOwn(body, propertyName),
    `Expected response body to include property "${String(propertyName)}"`,
  );

  if (arguments.length === 3) {
    assert.deepStrictEqual(
      body[propertyName],
      expectedValue,
      `Response body property "${String(propertyName)}" did not match the expected value`,
    );
  }
}

export function bodyIncludesProperties<TBody extends Record<string, unknown>>(
  actualBody: BodyAssertionTarget<TBody>,
  expectedProperties: Partial<TBody>,
) {
  const body = getBody(actualBody);

  for (const [propertyName, expectedValue] of Object.entries(
    expectedProperties,
  )) {
    assert.ok(
      Object.hasOwn(body, propertyName),
      `Expected response body to include property "${propertyName}"`,
    );
    assert.deepStrictEqual(
      body[propertyName],
      expectedValue,
      `Response body property "${propertyName}" did not match the expected value`,
    );
  }
}

export function bodyIsArray<TItem = unknown>(
  actualBody: BodyAssertionTarget<unknown>,
): asserts actualBody is TItem[] | RequestResult<TItem[]> {
  assert.ok(
    Array.isArray(getBody(actualBody)),
    "Expected response body to be an array",
  );
}

export function bodyArrayLengthIs<TItem = unknown>(
  actualBody: BodyAssertionTarget<TItem[]>,
  expectedLength: number,
) {
  const body = getBody(actualBody);

  assert.strictEqual(
    body.length,
    expectedLength,
    `Response body array length did not match ${expectedLength}`,
  );
}

export function bodyArrayIsNotEmpty<TItem = unknown>(
  actualBody: BodyAssertionTarget<TItem[]>,
) {
  const body = getBody(actualBody);

  assert.ok(
    body.length > 0,
    "Expected response body array to contain at least one item",
  );
}

export function bodyIsEmpty(actualBody: BodyAssertionTarget<unknown>) {
  const body = getBody(actualBody);

  assert.ok(
    body == null || body === "" || (Array.isArray(body) && body.length === 0),
    "Expected response body to be empty",
  );
}

export function bodyMatches<TBody>(
  actualBody: BodyAssertionTarget<TBody>,
  predicate: (body: TBody) => boolean,
  message = "Response body did not match the expected condition",
) {
  assert.ok(predicate(getBody(actualBody)), message);
}
