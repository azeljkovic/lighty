import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createClient,
  HttpRequestError,
  InvalidJsonResponseError,
  lightyAssert,
  request,
} from "../dist/index.js";

describe("namespace export", () => {
  it("exposes helpers through lighty", () => {
    lightyAssert.responseIsOk(makeResult(200));
    lightyAssert.statusCodeIs(makeResult(204), 204);
    lightyAssert.bodyEquals({ id: 1 }, { id: 1 });
  });
});

describe("requests", () => {
  it("creates a client with shared request defaults", async () => {
    const originalFetch = globalThis.fetch;
    const calls = [];

    globalThis.fetch = async (url, init) => {
      calls.push({ url: url.toString(), init });

      return new Response(JSON.stringify({ ok: true }), {
        status: 409,
        statusText: "Conflict",
        headers: { "content-type": "application/json" },
      });
    };

    try {
      const client = createClient({
        baseUrl: "https://api.example.test/v1",
        headers: new Headers([
          ["Authorization", "Bearer client-token"],
          ["x-client", "client"],
        ]),
        timeoutMs: 1000,
        throwOnHttpError: false,
        logger: false,
      });

      const result = await client.postRequest("/users", {
        params: { active: true },
        headers: [
          ["Authorization", "Bearer request-token"],
          ["x-request", "request"],
        ],
        body: { name: "Ada" },
      });

      assert.equal(result.response.status, 409);
      assert.deepEqual(result.body, { ok: true });

      assert.equal(
        calls[0].url,
        "https://api.example.test/v1/users?active=true",
      );
      assert.equal(calls[0].init.method, "POST");
      assert.equal(
        new Headers(calls[0].init.headers).get("authorization"),
        "Bearer request-token",
      );
      assert.equal(
        new Headers(calls[0].init.headers).get("x-client"),
        "client",
      );
      assert.equal(
        new Headers(calls[0].init.headers).get("x-request"),
        "request",
      );
      assert.equal(calls[0].init.body, JSON.stringify({ name: "Ada" }));
      assert.ok(calls[0].init.signal instanceof AbortSignal);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("throws HttpRequestError with parsed response details for HTTP errors", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          code: "invalid_request",
          message: "Email is required",
        }),
        {
          status: 422,
          statusText: "Unprocessable Entity",
          headers: {
            "content-type": "application/json",
            "x-request-id": "request-123",
          },
        },
      );

    try {
      await assert.rejects(
        request({
          method: "POST",
          url: "https://example.test/users",
          params: { source: "unit" },
          body: { name: "Ada" },
          logger: false,
        }),
        (error) => {
          assert.ok(error instanceof HttpRequestError);
          assert.equal(error.name, "HttpRequestError");
          assert.equal(error.message, "Request failed with status 422");
          assert.equal(error.status, 422);
          assert.equal(error.statusText, "Unprocessable Entity");
          assert.equal(error.headers["content-type"], "application/json");
          assert.equal(error.headers["x-request-id"], "request-123");
          assert.deepEqual(error.body, {
            code: "invalid_request",
            message: "Email is required",
          });
          assert.equal(error.url, "https://example.test/users?source=unit");

          return true;
        },
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("returns parsed response details for HTTP errors when throwOnHttpError is false", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ code: "invalid_request" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });

    try {
      const result = await request({
        method: "GET",
        url: "https://example.test/users",
        throwOnHttpError: false,
        logger: false,
      });

      assert.equal(result.response.status, 400);
      assert.deepEqual(result.body, { code: "invalid_request" });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("throws InvalidJsonResponseError with response details for invalid JSON", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () =>
      new Response("{invalid-json", {
        status: 200,
        statusText: "OK",
        headers: {
          "content-type": "application/json",
          "x-request-id": "request-123",
        },
      });

    try {
      await assert.rejects(
        request({
          method: "GET",
          url: "https://example.test/users",
          params: { source: "unit" },
          logger: false,
        }),
        (error) => {
          assert.ok(error instanceof InvalidJsonResponseError);
          assert.equal(error.name, "InvalidJsonResponseError");
          assert.equal(
            error.message,
            "Failed to parse JSON response from https://example.test/users?source=unit (status 200)",
          );
          assert.equal(error.status, 200);
          assert.equal(error.statusText, "OK");
          assert.equal(error.headers["content-type"], "application/json");
          assert.equal(error.headers["x-request-id"], "request-123");
          assert.equal(error.body, "{invalid-json");
          assert.equal(error.url, "https://example.test/users?source=unit");
          assert.ok(error.cause instanceof SyntaxError);

          return true;
        },
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("calls request logger hooks with redacted headers, URL params, and bodies", async () => {
    const originalFetch = globalThis.fetch;
    const events = [];

    globalThis.fetch = async (_url, init) => {
      const requestHeaders = new Headers(init.headers);

      assert.equal(requestHeaders.get("authorization"), "Bearer request-token");
      assert.equal(requestHeaders.get("cookie"), "session=request-cookie");
      assert.equal(
        init.body,
        JSON.stringify({
          username: "ada",
          password: "request-password",
          nested: {
            apiKey: "request-api-key",
            public: "visible",
          },
          list: [{ refreshToken: "request-refresh-token", id: 1 }],
        }),
      );

      return new Response(
        JSON.stringify({
          token: "response-token",
          profile: {
            name: "Ada",
            password: "response-password",
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-api-key": "response-api-key",
          },
        },
      );
    };

    try {
      const result = await request({
        method: "POST",
        url: "https://example.test/users?access_token=query-token&visible=1",
        headers: {
          Authorization: "Bearer request-token",
          Cookie: "session=request-cookie",
          "x-trace-id": "trace-123",
        },
        body: {
          username: "ada",
          password: "request-password",
          nested: {
            apiKey: "request-api-key",
            public: "visible",
          },
          list: [{ refreshToken: "request-refresh-token", id: 1 }],
        },
        logger: {
          level: "full",
          requestStart: (entry) => events.push(["requestStart", entry]),
          response: (entry) => events.push(["response", entry]),
          requestEnd: (entry) => events.push(["requestEnd", entry]),
        },
      });

      assert.deepEqual(result.body, {
        token: "response-token",
        profile: {
          name: "Ada",
          password: "response-password",
        },
      });

      const [requestStartName, requestStart] = events[0];
      const [responseName, response] = events[1];
      const [requestEndName, requestEnd] = events[2];

      assert.equal(requestStartName, "requestStart");
      assert.equal(
        new URL(requestStart.url).searchParams.get("access_token"),
        "[REDACTED]",
      );
      assert.equal(new URL(requestStart.url).searchParams.get("visible"), "1");
      assert.equal(requestStart.headers.Authorization, "[REDACTED]");
      assert.equal(requestStart.headers.Cookie, "[REDACTED]");
      assert.equal(requestStart.headers["x-trace-id"], "trace-123");
      assert.deepEqual(requestStart.body, {
        username: "ada",
        password: "[REDACTED]",
        nested: {
          apiKey: "[REDACTED]",
          public: "visible",
        },
        list: [{ refreshToken: "[REDACTED]", id: 1 }],
      });

      assert.equal(responseName, "response");
      assert.equal(response.status, 200);
      assert.equal(response.headers["content-type"], "application/json");
      assert.equal(response.headers["x-api-key"], "[REDACTED]");
      assert.deepEqual(response.body, {
        token: "[REDACTED]",
        profile: {
          name: "Ada",
          password: "[REDACTED]",
        },
      });

      assert.equal(requestEndName, "requestEnd");
      assert.equal(requestEnd.status, 200);
      assert.equal(requestEnd.ok, true);
      assert.equal(typeof requestEnd.durationMs, "number");
      assert.equal(requestEnd.error, undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses basic logging by default when a logger is provided", async () => {
    const originalFetch = globalThis.fetch;
    const events = [];

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });

    try {
      await request({
        method: "GET",
        url: "https://example.test/users",
        logger: {
          requestStart: () => events.push("requestStart"),
          response: () => events.push("response"),
          requestEnd: () => events.push("requestEnd"),
        },
      });

      assert.deepEqual(events, ["requestStart", "requestEnd"]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("uses basic console logging by default when no logger is provided", async () => {
    const originalFetch = globalThis.fetch;
    const originalConsoleLog = console.log;
    const logs = [];

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    console.log = (...args) => logs.push(args);

    try {
      await request({
        method: "GET",
        url: "https://example.test/users",
      });

      assert.equal(logs.length, 2);
      assert.match(
        logs[0][0],
        /^\[lighty\] GET https:\/\/example\.test\/users started$/,
      );
      assert.match(
        logs[1][0],
        /^\[lighty\] GET https:\/\/example\.test\/users completed in \d+ms \(200 ok\)$/,
      );
    } finally {
      console.log = originalConsoleLog;
      globalThis.fetch = originalFetch;
    }
  });

  it("supports logging level strings with the built-in logger", async () => {
    const originalFetch = globalThis.fetch;
    const originalConsoleLog = console.log;
    const logs = [];

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ token: "response-token", ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-api-key": "response-api-key",
        },
      });
    console.log = (...args) => logs.push(args);

    try {
      await request({
        method: "GET",
        url: "https://example.test/users",
        logger: "off",
      });

      assert.deepEqual(logs, []);

      await request({
        method: "GET",
        url: "https://example.test/users",
        logger: "basic",
      });

      assert.equal(logs.length, 2);
      assert.match(logs[0][0], /^\[lighty\] GET .* started$/);
      assert.match(logs[1][0], /^\[lighty\] GET .* completed/);

      logs.length = 0;

      await request({
        method: "GET",
        url: "https://example.test/users",
        logger: "full",
      });

      assert.equal(logs.length, 3);
      assert.match(logs[0][0], /^\[lighty\] GET .* started$/);
      assert.equal(logs[1][0], "[lighty] response");
      assert.equal(logs[1][1].headers["x-api-key"], "[REDACTED]");
      assert.deepEqual(logs[1][1].body, {
        token: "[REDACTED]",
        ok: true,
      });
      assert.match(logs[2][0], /^\[lighty\] GET .* completed/);
    } finally {
      console.log = originalConsoleLog;
      globalThis.fetch = originalFetch;
    }
  });

  it("does not call logger hooks when logging level is off", async () => {
    const originalFetch = globalThis.fetch;
    const events = [];

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });

    try {
      await request({
        method: "GET",
        url: "https://example.test/users",
        logger: {
          level: "off",
          requestStart: () => events.push("requestStart"),
          response: () => events.push("response"),
          requestEnd: () => events.push("requestEnd"),
        },
      });

      await request({
        method: "GET",
        url: "https://example.test/users",
        logger: false,
      });

      assert.deepEqual(events, []);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("aborts fetch when timeoutMs elapses", async () => {
    const originalFetch = globalThis.fetch;
    let observedSignal;

    globalThis.fetch = async (_url, init) => {
      observedSignal = init.signal;

      return new Promise((_resolve, reject) => {
        init.signal.addEventListener(
          "abort",
          () => reject(init.signal.reason),
          { once: true },
        );
      });
    };

    try {
      await assert.rejects(
        request({
          method: "GET",
          url: "https://example.test/resource",
          timeoutMs: 1,
          logger: false,
        }),
        { name: "TimeoutError" },
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
    assert.throws(
      () => lightyAssert.responseIsOk(makeResult(500)),
      /outside of range 200-299/,
    );
    assert.throws(
      () => lightyAssert.responseIsCreated(makeResult(200)),
      /does not match the expected status code 201/,
    );
    assert.throws(
      () => lightyAssert.responseIsNoContent(makeResult(200)),
      /does not match the expected status code 204/,
    );
    assert.throws(
      () => lightyAssert.responseIsBadRequest(makeResult(200)),
      /does not match the expected status code 400/,
    );
    assert.throws(
      () => lightyAssert.responseIsUnauthorized(makeResult(200)),
      /does not match the expected status code 401/,
    );
    assert.throws(
      () => lightyAssert.responseIsForbidden(makeResult(200)),
      /does not match the expected status code 403/,
    );
    assert.throws(
      () => lightyAssert.responseIsNotFound(makeResult(200)),
      /does not match the expected status code 404/,
    );
    assert.throws(
      () => lightyAssert.responseIsServerError(makeResult(400)),
      /was not between 500 and 599/,
    );
    assert.throws(
      () => lightyAssert.statusCodeIs(makeResult(200), 201),
      /does not match the expected status code 201/,
    );
    assert.throws(
      () => lightyAssert.statusCodeIsOneOf(makeResult(404), [200, 201]),
      /was not one of: 200, 201/,
    );
    assert.throws(
      () => lightyAssert.statusCodeIsInRange(makeResult(300), 200, 299),
      /was not between 200 and 299/,
    );
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

    assert.throws(
      () => lightyAssert.headerExists(result, "x-trace-id"),
      /Expected response header "x-trace-id" to exist/,
    );
    assert.throws(
      () => lightyAssert.headerIs(result, "x-request-id", "request-456"),
      /did not match the expected value/,
    );
    assert.throws(
      () =>
        lightyAssert.headerIncludes(result, "content-type", "application/json"),
      /did not include "application\/json"/,
    );
    assert.throws(
      () => lightyAssert.contentTypeIsJson(result),
      /did not include "application\/json"/,
    );
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
    lightyAssert.bodyIncludesProperties(result, { id: 1, active: true });
    lightyAssert.bodyMatches(result, (body) => body.roles.includes("admin"));
  });

  it("passes for array bodies", () => {
    const result = makeResult(200, [{ id: 1 }, { id: 2 }]);

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
    lightyAssert.bodyEquals({ id: 1 }, { id: 1 });
    lightyAssert.bodyHasProperty({ id: 1 }, "id", 1);
    lightyAssert.bodyIsArray([1, 2, 3]);
    lightyAssert.bodyArrayLengthIs([1, 2, 3], 3);
    lightyAssert.bodyArrayIsNotEmpty([1]);
    lightyAssert.bodyMatches({ enabled: true }, (body) => body.enabled);
  });

  it("throws for mismatched object bodies", () => {
    const result = makeResult(200, { id: 1, name: "Ada" });

    assert.throws(
      () => lightyAssert.bodyEquals(result, { id: 2, name: "Ada" }),
      /did not match the expected body/,
    );
    assert.throws(
      () => lightyAssert.bodyHasProperty(result, "email"),
      /Expected response body to include property "email"/,
    );
    assert.throws(
      () => lightyAssert.bodyHasProperty(result, "name", "Grace"),
      /did not match the expected value/,
    );
    assert.throws(
      () => lightyAssert.bodyIncludesProperties(result, { id: 2 }),
      /did not match the expected value/,
    );
    assert.throws(
      () => lightyAssert.bodyMatches(result, (body) => body.id === 2),
      /did not match the expected condition/,
    );
  });

  it("throws for mismatched array and empty body expectations", () => {
    assert.throws(
      () => lightyAssert.bodyIsArray(makeResult(200, { id: 1 })),
      /Expected response body to be an array/,
    );
    assert.throws(
      () => lightyAssert.bodyArrayLengthIs(makeResult(200, [1, 2]), 1),
      /array length did not match 1/,
    );
    assert.throws(
      () => lightyAssert.bodyArrayIsNotEmpty(makeResult(200, [])),
      /contain at least one item/,
    );
    assert.throws(
      () => lightyAssert.bodyIsEmpty(makeResult(200, { id: 1 })),
      /Expected response body to be empty/,
    );
  });
});

function makeResult(status, body, headers = {}) {
  return {
    response: makeResponse(status, headers),
    body,
  };
}

function makeResponse(status, headers = {}) {
  return new Response(null, { status, headers });
}
