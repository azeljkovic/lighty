import * as assert from "node:assert";
import { inspect } from "node:util";

export function formatValue(value: unknown): string {
  return inspect(value, {
    breakLength: 100,
    depth: 6,
    maxArrayLength: 20,
    sorted: true,
  });
}

export function formatThrown(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return formatValue(error);
}

export function assertionErrorWithCause(
  options: assert.AssertionErrorOptions & { cause: unknown },
): assert.AssertionError & { cause: unknown } {
  const error = new assert.AssertionError(options) as assert.AssertionError & {
    cause: unknown;
  };

  Object.defineProperty(error, "cause", {
    configurable: true,
    value: options.cause,
    writable: true,
  });

  return error;
}
