import assert from "node:assert/strict";
import {describe, it} from "node:test";
import {lightyAssert, request} from "../dist/index.js";

describe("namespace export", () => {
  it("exposes helpers through lighty", () => {
    lightyAssert.responseIsOk(makeResult(200))
    lightyAssert.statusCodeIs(makeResult(204), 204);
    lightyAssert.bodyEquals({id: 1}, {id: 1});
  });
});

describe("requests", () => {
  it("aborts fetch when timeoutMs elapses", async () => {
    const originalFetch = globalThis.fetch;
    let observedSignal;

    globalThis.fetch = async (_url, init) => {
      observedSignal = init.signal;

      return new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(init.signal.reason), {once: true});
      });
    };

    try {
      await assert.rejects(
        request({
          method: "GET",
          url: "https://example.test/resource",
          timeoutMs: 1,
        }),
        {name: "TimeoutError"}
      );

      assert.ok(observedSignal instanceof AbortSignal);
      assert.equal(observedSignal.aborted, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("response assertions", () => {
  it("passes for expected response status helpers", () => {
    lightyAssert.responseIsOk(makeResult(200));
    lightyAssert.responseIsCreated(makeResult(201));
    lightyAssert.responseIsNoContent(makeResult(204));
    lightyAssert.responseIsBadRequest(makeResult(400));
    lightyAssert.responseIsUnauthorized(makeResult(401));
    lightyAssert.responseIsForbidden(makeResult(403));
    lightyAssert.responseIsNotFound(makeResult(404));
    lightyAssert.responseIsServerError(makeResult(503));
    lightyAssert.statusCodeIs(makeResult(202), 202);
    lightyAssert.statusCodeIsOneOf(makeResult(204), [200, 201, 204]);
    lightyAssert.statusCodeIsInRange(makeResult(299), 200, 299);
  });

  it("passes when given a raw Response", () => {
    lightyAssert.responseIsOk(makeResponse(200));
    lightyAssert.statusCodeIs(makeResponse(204), 204);
  });

  it("throws for unexpected statuses", () => {
    assert.throws(() => lightyAssert.responseIsOk(makeResult(500)), /outside of range 200-299/);
    assert.throws(() => lightyAssert.responseIsCreated(makeResult(200)), /does not match the expected status code 201/);
    assert.throws(() => lightyAssert.responseIsNoContent(makeResult(200)), /does not match the expected status code 204/);
    assert.throws(() => lightyAssert.responseIsBadRequest(makeResult(200)), /does not match the expected status code 400/);
    assert.throws(() => lightyAssert.responseIsUnauthorized(makeResult(200)), /does not match the expected status code 401/);
    assert.throws(() => lightyAssert.responseIsForbidden(makeResult(200)), /does not match the expected status code 403/);
    assert.throws(() => lightyAssert.responseIsNotFound(makeResult(200)), /does not match the expected status code 404/);
    assert.throws(() => lightyAssert.responseIsServerError(makeResult(400)), /was not between 500 and 599/);
    assert.throws(() => lightyAssert.statusCodeIs(makeResult(200), 201), /does not match the expected status code 201/);
    assert.throws(() => lightyAssert.statusCodeIsOneOf(makeResult(404), [200, 201]), /was not one of: 200, 201/);
    assert.throws(() => lightyAssert.statusCodeIsInRange(makeResult(300), 200, 299), /was not between 200 and 299/);
  });
});

describe("header assertions", () => {
  it("passes for matching headers", () => {
    const result = makeResult(200, undefined, {
      "content-type": "application/json; charset=utf-8",
      "x-request-id": "request-123",
    });

    lightyAssert.headerExists(result, "x-request-id");
    lightyAssert.headerIs(result, "x-request-id", "request-123");
    lightyAssert.headerIncludes(result, "content-type", "application/json");
    lightyAssert.contentTypeIsJson(result);
  });

  it("throws for missing or mismatched headers", () => {
    const result = makeResult(200, undefined, {
      "content-type": "text/plain",
      "x-request-id": "request-123",
    });

    assert.throws(() => lightyAssert.headerExists(result, "x-trace-id"), /Expected response header "x-trace-id" to exist/);
    assert.throws(() => lightyAssert.headerIs(result, "x-request-id", "request-456"), /did not match the expected value/);
    assert.throws(() => lightyAssert.headerIncludes(result, "content-type", "application/json"), /did not include "application\/json"/);
    assert.throws(() => lightyAssert.contentTypeIsJson(result), /did not include "application\/json"/);
  });
});

describe("body assertions", () => {
  it("passes for matching object bodies", () => {
    const result = makeResult(200, {
      id: 1,
      name: "Ada",
      active: true,
      roles: ["admin"],
    });

    lightyAssert.bodyEquals(result, {
      id: 1,
      name: "Ada",
      active: true,
      roles: ["admin"],
    });
    lightyAssert.bodyHasProperty(result, "id");
    lightyAssert.bodyHasProperty(result, "name", "Ada");
    lightyAssert.bodyIncludesProperties(result, {id: 1, active: true});
    lightyAssert.bodyMatches(result, body => body.roles.includes("admin"));
  });

  it("passes for array bodies", () => {
    const result = makeResult(200, [{id: 1}, {id: 2}]);

    lightyAssert.bodyIsArray(result);
    lightyAssert.bodyArrayLengthIs(result, 2);
    lightyAssert.bodyArrayIsNotEmpty(result);
  });

  it("passes for empty bodies", () => {
    lightyAssert.bodyIsEmpty(makeResult(204, undefined));
    lightyAssert.bodyIsEmpty(makeResult(200, null));
    lightyAssert.bodyIsEmpty(makeResult(200, ""));
    lightyAssert.bodyIsEmpty(makeResult(200, []));
  });

  it("passes when given raw bodies", () => {
    lightyAssert.bodyEquals({id: 1}, {id: 1});
    lightyAssert.bodyHasProperty({id: 1}, "id", 1);
    lightyAssert.bodyIsArray([1, 2, 3]);
    lightyAssert.bodyArrayLengthIs([1, 2, 3], 3);
    lightyAssert.bodyArrayIsNotEmpty([1]);
    lightyAssert.bodyMatches({enabled: true}, body => body.enabled);
  });

  it("throws for mismatched object bodies", () => {
    const result = makeResult(200, {id: 1, name: "Ada"});

    assert.throws(() => lightyAssert.bodyEquals(result, {id: 2, name: "Ada"}), /did not match the expected body/);
    assert.throws(() => lightyAssert.bodyHasProperty(result, "email"), /Expected response body to include property "email"/);
    assert.throws(() => lightyAssert.bodyHasProperty(result, "name", "Grace"), /did not match the expected value/);
    assert.throws(() => lightyAssert.bodyIncludesProperties(result, {id: 2}), /did not match the expected value/);
    assert.throws(() => lightyAssert.bodyMatches(result, body => body.id === 2), /did not match the expected condition/);
  });

  it("throws for mismatched array and empty body expectations", () => {
    assert.throws(() => lightyAssert.bodyIsArray(makeResult(200, {id: 1})), /Expected response body to be an array/);
    assert.throws(() => lightyAssert.bodyArrayLengthIs(makeResult(200, [1, 2]), 1), /array length did not match 1/);
    assert.throws(() => lightyAssert.bodyArrayIsNotEmpty(makeResult(200, [])), /contain at least one item/);
    assert.throws(() => lightyAssert.bodyIsEmpty(makeResult(200, {id: 1})), /Expected response body to be empty/);
  });
});

function makeResult(status, body, headers = {}) {
  return {
    response: makeResponse(status, headers),
    body,
  };
}

function makeResponse(status, headers = {}) {
  return new Response(null, {status, headers});
}
