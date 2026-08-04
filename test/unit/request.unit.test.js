import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createClient,
  HttpRequestError,
  InvalidJsonResponseError,
  customRequest,
} from "../../dist/index.js";
import { jsonResponse, textResponse } from "../helpers/responses.js";

describe("requests", () => {
  it("creates a client with shared request defaults", async (t) => {
    const calls = [];

    t.mock.method(globalThis, "fetch", async (url, init) => {
      calls.push({ url: url.toString(), init });

      return jsonResponse(
        { ok: true },
        {
          status: 409,
          statusText: "Conflict",
        },
      );
    });

    const client = createClient({
      baseUrl: "https://api.example.test/v1",
      headers: new Headers([
        ["Authorization", "Bearer client-token"],
        ["x-client", "client"],
      ]),
      timeoutMs: 1000,
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

    assert.equal(result.status, 409);
    assert.equal(result.ok, false);
    assert.equal(result.headers["content-type"], "application/json");
    assert.deepEqual(result.data, { ok: true });
    assert.ok(result.response instanceof Response);

    assert.equal(calls[0].url, "https://api.example.test/v1/users?active=true");
    assert.equal(calls[0].init.method, "POST");
    assert.equal(
      new Headers(calls[0].init.headers).get("authorization"),
      "Bearer request-token",
    );
    assert.equal(new Headers(calls[0].init.headers).get("x-client"), "client");
    assert.equal(
      new Headers(calls[0].init.headers).get("x-request"),
      "request",
    );
    assert.equal(calls[0].init.body, JSON.stringify({ name: "Ada" }));
    assert.ok(calls[0].init.signal instanceof AbortSignal);
  });

  it("exposes customRequest on clients with shared request defaults", async (t) => {
    const calls = [];

    t.mock.method(globalThis, "fetch", async (url, init) => {
      calls.push({ url: url.toString(), init });

      return jsonResponse({ ok: true });
    });

    const client = createClient({
      baseUrl: "https://api.example.test/v1",
      headers: {
        Authorization: "Bearer client-token",
      },
      logger: false,
    });

    const result = await client.customRequest({
      method: "POST",
      url: "/users",
      body: { name: "Ada" },
    });

    assert.deepEqual(result.data, { ok: true });
    assert.equal(calls[0].url, "https://api.example.test/v1/users");
    assert.equal(calls[0].init.method, "POST");
    assert.equal(
      new Headers(calls[0].init.headers).get("authorization"),
      "Bearer client-token",
    );
    assert.equal(calls[0].init.body, JSON.stringify({ name: "Ada" }));
  });

  it("passes native fetch bodies through without a JSON content type", async (t) => {
    const calls = [];
    const formData = new FormData();
    const binary = new Uint8Array([1, 2, 3]);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("streamed"));
        controller.close();
      },
    });

    t.mock.method(globalThis, "fetch", async (_url, init) => {
      calls.push(init);
      return jsonResponse({ ok: true });
    });

    formData.append("name", "Ada");

    for (const body of ["plain text", formData, binary, stream]) {
      await customRequest({
        method: "POST",
        url: "https://example.test/bodies",
        body,
        logger: false,
      });
    }

    assert.equal(calls[0].body, "plain text");
    assert.equal(calls[1].body, formData);
    assert.equal(calls[2].body, binary);
    assert.equal(calls[3].body, stream);
    assert.equal(calls[3].duplex, "half");

    for (const call of calls) {
      assert.equal(new Headers(call.headers).has("content-type"), false);
    }
  });

  it("throws HttpRequestError with parsed response details for HTTP errors", async (t) => {
    t.mock.method(globalThis, "fetch", async () =>
      jsonResponse(
        {
          code: "invalid_request",
          message: "Email is required",
        },
        {
          status: 422,
          statusText: "Unprocessable Entity",
          headers: {
            "x-request-id": "request-123",
          },
        },
      ),
    );

    await assert.rejects(
      customRequest({
        method: "POST",
        url: "https://example.test/users",
        params: { source: "unit" },
        body: { name: "Ada" },
        throwOnHttpError: true,
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
  });

  it("returns parsed response details for HTTP errors by default", async (t) => {
    t.mock.method(globalThis, "fetch", async () =>
      jsonResponse({ code: "invalid_request" }, { status: 400 }),
    );

    const result = await customRequest({
      method: "GET",
      url: "https://example.test/users",
      logger: false,
    });

    assert.equal(result.status, 400);
    assert.equal(result.ok, false);
    assert.equal(result.headers["content-type"], "application/json");
    assert.deepEqual(result.data, { code: "invalid_request" });
  });

  it("parses JSON when responseType is json", async (t) => {
    t.mock.method(globalThis, "fetch", async () =>
      textResponse(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "text/plain" },
      }),
    );

    assert.deepEqual(
      (
        await customRequest({
          method: "GET",
          url: "https://example.test/json",
          responseType: "json",
          logger: false,
        })
      ).data,
      { ok: true },
    );
  });

  it("applies a response parser after parsing and passes the raw response", async (t) => {
    t.mock.method(globalThis, "fetch", async () =>
      jsonResponse({ id: 7, name: "Ada" }),
    );

    let parserResponse;
    const result = await customRequest({
      method: "GET",
      url: "https://example.test/users/ada",
      responseParser: (body, response) => {
        parserResponse = response;
        assert.deepEqual(body, { id: 7, name: "Ada" });

        return { id: String(body.id), name: body.name };
      },
      logger: false,
    });

    assert.ok(parserResponse instanceof Response);
    assert.deepEqual(result.data, { id: "7", name: "Ada" });
  });

  it("accepts schema-like response parsers as client defaults", async (t) => {
    t.mock.method(globalThis, "fetch", async () =>
      jsonResponse({ id: 7, name: "Ada", role: "admin" }),
    );

    const client = createClient({
      baseUrl: "https://example.test",
      responseParser: {
        parse(body) {
          assert.deepEqual(body, { id: 7, name: "Ada", role: "admin" });
          return { id: body.id, name: body.name };
        },
      },
      logger: false,
    });

    const result = await client.getRequest("/users/ada");

    assert.deepEqual(result.data, { id: 7, name: "Ada" });
  });

  for (const contentType of [
    "application/problem+json",
    "application/vnd.api+json; charset=utf-8",
    "text/example+json",
  ]) {
    it(`parses JSON for ${contentType} responses`, async (t) => {
      t.mock.method(globalThis, "fetch", async () =>
        textResponse(JSON.stringify({ type: contentType }), {
          status: 200,
          headers: { "content-type": contentType },
        }),
      );

      const result = await customRequest({
        method: "GET",
        url: "https://example.test/json-suffix",
        logger: false,
      });

      assert.deepEqual(result.data, { type: contentType });
    });
  }

  it("returns text when responseType is text", async (t) => {
    t.mock.method(globalThis, "fetch", async () => jsonResponse({ ok: true }));

    assert.equal(
      (
        await customRequest({
          method: "GET",
          url: "https://example.test/text",
          responseType: "text",
          logger: false,
        })
      ).data,
      JSON.stringify({ ok: true }),
    );
  });

  it("returns an ArrayBuffer when responseType is arrayBuffer", async (t) => {
    t.mock.method(globalThis, "fetch", async () =>
      textResponse("binary", { status: 200 }),
    );

    const arrayBufferResult = await customRequest({
      method: "GET",
      url: "https://example.test/array-buffer",
      responseType: "arrayBuffer",
      logger: false,
    });
    assert.ok(arrayBufferResult.data instanceof ArrayBuffer);
    assert.equal(new TextDecoder().decode(arrayBufferResult.data), "binary");
  });

  it("returns and logs application/octet-stream responses as an ArrayBuffer", async (t) => {
    const events = [];

    t.mock.method(
      globalThis,
      "fetch",
      async () =>
        new Response(Uint8Array.from([0, 1, 2, 255]), {
          status: 200,
          headers: { "content-type": "application/octet-stream" },
        }),
    );

    const result = await customRequest({
      method: "GET",
      url: "https://example.test/bytes",
      logger: {
        level: "verbose",
        response: (entry) => events.push(entry),
      },
    });

    assert.ok(result.data instanceof ArrayBuffer);
    assert.deepEqual(
      new Uint8Array(result.data),
      Uint8Array.from([0, 1, 2, 255]),
    );
    assert.deepEqual(events[0].body, Uint8Array.from([0, 1, 2, 255]));
  });

  it("returns a Blob when responseType is blob", async (t) => {
    t.mock.method(globalThis, "fetch", async () =>
      textResponse("file", {
        status: 200,
        headers: { "content-type": "text/plain" },
      }),
    );

    const blobResult = await customRequest({
      method: "GET",
      url: "https://example.test/blob",
      responseType: "blob",
      logger: false,
    });
    assert.ok(blobResult.data instanceof Blob);
    assert.equal(await blobResult.data.text(), "file");
    assert.equal(blobResult.data.type, "text/plain");
  });

  it("returns a ReadableStream when responseType is stream", async (t) => {
    t.mock.method(globalThis, "fetch", async () =>
      textResponse("streamed", { status: 200 }),
    );

    const streamResult = await customRequest({
      method: "GET",
      url: "https://example.test/stream",
      responseType: "stream",
      logger: false,
    });
    assert.ok(streamResult.data instanceof ReadableStream);
    assert.equal(await new Response(streamResult.data).text(), "streamed");
  });

  it("skips parsing when responseType is none", async (t) => {
    t.mock.method(globalThis, "fetch", async () =>
      textResponse("ignored", { status: 200 }),
    );

    const noneResult = await customRequest({
      method: "GET",
      url: "https://example.test/none",
      responseType: "none",
      logger: false,
    });
    assert.equal(noneResult.data, undefined);
  });

  it("uses client responseType defaults", async (t) => {
    t.mock.method(globalThis, "fetch", async () => jsonResponse({ ok: true }));

    const client = createClient({
      baseUrl: "https://example.test",
      responseType: "text",
      logger: false,
    });

    const defaultResult = await client.getRequest("/default");
    assert.equal(defaultResult.data, JSON.stringify({ ok: true }));

    const overrideResult = await client.getRequest("/override", {
      responseType: "json",
    });
    assert.deepEqual(overrideResult.data, { ok: true });
  });

  it("throws InvalidJsonResponseError with response details for invalid JSON", async (t) => {
    t.mock.method(globalThis, "fetch", async () =>
      textResponse("{invalid-json", {
        status: 200,
        statusText: "OK",
        headers: {
          "content-type": "application/json",
          "x-request-id": "request-123",
        },
      }),
    );

    await assert.rejects(
      customRequest({
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
  });

  it("calls request logger hooks with redacted headers, URL params, and bodies", async (t) => {
    const events = [];

    t.mock.method(globalThis, "fetch", async (_url, init) => {
      const requestHeaders = new Headers(init.headers);

      // asserts the outgoing request is not redacted
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

      return jsonResponse(
        {
          token: "response-token",
          profile: {
            name: "Ada",
            password: "response-password",
          },
        },
        {
          status: 200,
          headers: {
            "access-control-allow-credentials": "true",
            "x-api-key": "response-api-key",
          },
        },
      );
    });

    const result = await customRequest({
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
        level: "verbose",
        // hooks push their received entries into events, so the test can inspect exactly what the logger saw
        requestStart: (entry) => events.push(["requestStart", entry]),
        response: (entry) => events.push(["response", entry]),
        requestEnd: (entry) => events.push(["requestEnd", entry]),
      },
    });

    assert.deepEqual(result.data, {
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
    // access-control-allow-credentials should not be redacted, it's an exception on the allow-list
    assert.equal(response.headers["access-control-allow-credentials"], "true");
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
  });

  it("uses basic logging by default when a logger is provided", async (t) => {
    const events = [];

    t.mock.method(globalThis, "fetch", async () => jsonResponse({ ok: true }));

    await customRequest({
      method: "GET",
      url: "https://example.test/users",
      logger: {
        requestStart: () => events.push("requestStart"),
        response: () => events.push("response"),
        requestEnd: () => events.push("requestEnd"),
      },
    });

    assert.deepEqual(events, ["requestStart", "requestEnd"]);
  });

  it("does not log when no logger is provided", async (t) => {
    const logs = [];

    t.mock.method(globalThis, "fetch", async () => jsonResponse({ ok: true }));
    t.mock.method(console, "log", (...args) => logs.push(args));

    await customRequest({
      method: "GET",
      url: "https://example.test/users",
    });

    assert.deepEqual(logs, []);
  });

  it("supports logging level strings with the built-in logger", async (t) => {
    const logs = [];

    t.mock.method(globalThis, "fetch", async () =>
      jsonResponse(
        { token: "response-token", ok: true },
        {
          status: 200,
          headers: {
            "x-api-key": "response-api-key",
          },
        },
      ),
    );
    t.mock.method(console, "log", (...args) => logs.push(args));

    await customRequest({
      method: "GET",
      url: "https://example.test/users",
      logger: "off",
    });

    assert.deepEqual(logs, []);

    await customRequest({
      method: "GET",
      url: "https://example.test/users",
      logger: "basic",
    });

    assert.equal(logs.length, 2);
    assert.match(logs[0][0], /^\[⚡️lighty\] GET .* started$/);
    assert.match(logs[1][0], /^\[⚡️lighty\] GET .* completed/);

    logs.length = 0;

    await customRequest({
      method: "GET",
      url: "https://example.test/users",
      logger: "verbose",
    });

    assert.equal(logs.length, 3);
    assert.match(logs[0][0], /^\[⚡️lighty\] GET .* started$/);
    assert.equal(logs[1][0], "[⚡️lighty] response");
    assert.equal(logs[1][1].headers["x-api-key"], "[REDACTED]");
    assert.deepEqual(logs[1][1].body, {
      token: "[REDACTED]",
      ok: true,
    });
    assert.match(logs[2][0], /^\[⚡️lighty\] GET .* completed/);
  });

  it("does not call logger hooks when logging level is off", async (t) => {
    const events = [];

    t.mock.method(globalThis, "fetch", async () => jsonResponse({ ok: true }));

    await customRequest({
      method: "GET",
      url: "https://example.test/users",
      logger: {
        level: "off",
        requestStart: () => events.push("requestStart"),
        response: () => events.push("response"),
        requestEnd: () => events.push("requestEnd"),
      },
    });

    await customRequest({
      method: "GET",
      url: "https://example.test/users",
      logger: false,
    });

    assert.deepEqual(events, []);
  });

  it("aborts fetch when timeoutMs elapses", async (t) => {
    let observedSignal;

    t.mock.method(globalThis, "fetch", async (_url, init) => {
      observedSignal = init.signal;

      return new Promise((_resolve, reject) => {
        init.signal.addEventListener(
          "abort",
          () => reject(init.signal.reason),
          { once: true },
        );
      });
    });

    await assert.rejects(
      customRequest({
        method: "GET",
        url: "https://example.test/resource",
        timeoutMs: 1,
        logger: false,
      }),
      { name: "TimeoutError" },
    );

    assert.ok(observedSignal instanceof AbortSignal);
    assert.equal(observedSignal.aborted, true);
  });
});
