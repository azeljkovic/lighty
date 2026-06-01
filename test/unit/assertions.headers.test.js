import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lightyAssert } from "../../dist/index.js";
import { makeResult } from "../helpers/responses.js";

describe("header assertions", () => {
  it("passes for matching headers", () => {
    const result = makeResult(200, undefined, {
      "content-type": "application/json; charset=utf-8",
      "x-request-id": "request-123",
    });

    lightyAssert.headerExists(result, "x-request-id");
    lightyAssert.headerIs(result, "x-request-id", "request-123");
    lightyAssert.headerIncludes(result, "content-type", "application/json");
    lightyAssert.headerMatches(result, "x-request-id", /^request-\d+$/);
    lightyAssert.headerSatisfies(result, "content-type", (headerValue) =>
      headerValue.endsWith("charset=utf-8"),
    );
    lightyAssert.contentTypeIsJson(result);
  });

  it("throws for missing or mismatched headers", () => {
    const result = makeResult(200, undefined, {
      "content-type": "text/plain",
      "x-request-id": "request-123",
    });

    assert.throws(
      () => lightyAssert.headerExists(result, "x-trace-id"),
      /Expected response header "x-trace-id" to exist; available headers: 'content-type', 'x-request-id'/,
    );
    assert.throws(
      () => lightyAssert.headerIs(result, "x-request-id", "request-456"),
      /expected 'request-456', received 'request-123'/,
    );
    assert.throws(
      () =>
        lightyAssert.headerIncludes(result, "content-type", "application/json"),
      /did not include 'application\/json'; received 'text\/plain'/,
    );
    assert.throws(
      () => lightyAssert.headerMatches(result, "x-request-id", /^trace-/),
      /did not match \/\^trace-\//,
    );
    assert.throws(
      () => lightyAssert.headerMatches(result, "x-trace-id", /^trace-/),
      /received missing; available headers: 'content-type', 'x-request-id'/,
    );
    assert.throws(
      () =>
        lightyAssert.headerSatisfies(
          result,
          "x-request-id",
          (headerValue) => headerValue === "request-456",
        ),
      /did not match the expected condition; received 'request-123'/,
    );
    assert.throws(
      () => lightyAssert.headerSatisfies(result, "x-trace-id", () => true),
      /Expected response header "x-trace-id" to exist; available headers: 'content-type', 'x-request-id'/,
    );
    assert.throws(
      () => lightyAssert.contentTypeIsJson(result),
      /did not include 'application\/json'; received 'text\/plain'/,
    );
  });

  it("wraps header predicate exceptions with context", () => {
    const result = makeResult(200, undefined, {
      "content-type": "text/plain",
    });

    assert.throws(
      () =>
        lightyAssert.headerSatisfies(result, "content-type", () => {
          throw new Error("invalid header parser state");
        }),
      (error) => {
        assert.equal(error.name, "AssertionError");
        assert.match(
          error.message,
          /Response header "content-type" predicate threw while evaluating received value 'text\/plain': Error: invalid header parser state/,
        );
        assert.equal(error.cause.message, "invalid header parser state");
        return true;
      },
    );
  });

  it("throws assertion failures for invalid header response targets", () => {
    assert.throws(() => lightyAssert.headerExists(null, "x-request-id"), {
      name: "AssertionError",
      message:
        /Expected response assertion target to be a Response or a request result/,
    });
  });
});
