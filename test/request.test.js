import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createServer } from "node:http";
import { describe, it } from "node:test";
import {
  createClient,
  HttpRequestError,
  InvalidJsonResponseError,
  request,
} from "../dist/index.js";

describe("request behavior with a local HTTP server", () => {
  it("sends method, query params, headers, and JSON body", async () => {
    await withTestServer(
      async (req, res) => {
        assert.equal(req.method, "POST");
        assert.equal(req.url, "/users?active=true&role=admin&role=editor");
        assert.equal(req.headers.accept, "application/json");
        assert.equal(req.headers["content-type"], "application/json");
        assert.equal(req.headers.authorization, "Bearer request-token");
        assert.equal(req.headers["x-client"], "client");
        assert.equal(req.headers["x-request"], "request");

        const body = await readRequestJson(req);
        assert.deepEqual(body, { name: "Ada" });

        res.writeHead(201, {
          "content-type": "application/json",
          "x-request-id": "local-request-123",
        });
        res.end(JSON.stringify({ id: 1, name: "Ada" }));
      },
      async (baseUrl) => {
        const client = createClient({
          baseUrl: `${baseUrl}/v1/..`,
          headers: {
            Authorization: "Bearer client-token",
            "x-client": "client",
          },
          logger: false,
        });

        const result = await client.postRequest("/users", {
          params: {
            active: true,
            role: ["admin", "editor"],
            empty: null,
            skipped: undefined,
          },
          headers: {
            Authorization: "Bearer request-token",
            "x-request": "request",
          },
          body: { name: "Ada" },
        });

        assert.equal(result.status, 201);
        assert.equal(result.ok, true);
        assert.equal(result.headers["content-type"], "application/json");
        assert.equal(result.headers["x-request-id"], "local-request-123");
        assert.deepEqual(result.data, { id: 1, name: "Ada" });
        assert.ok(result.response instanceof Response);
      },
    );
  });

  it("surfaces HTTP error response details", async () => {
    await withTestServer(
      async (req, res) => {
        assert.equal(req.method, "PATCH");
        assert.equal(req.url, "/users/1?source=unit");
        assert.deepEqual(await readRequestJson(req), { email: "" });

        res.writeHead(422, {
          "content-type": "application/json",
          "x-request-id": "local-error-123",
        });
        res.end(
          JSON.stringify({
            code: "invalid_request",
            message: "Email is required",
          }),
        );
      },
      async (baseUrl) => {
        await assert.rejects(
          request({
            method: "PATCH",
            url: `${baseUrl}/users/1`,
            params: { source: "unit" },
            body: { email: "" },
            logger: false,
          }),
          (error) => {
            assert.ok(error instanceof HttpRequestError);
            assert.equal(error.status, 422);
            assert.equal(error.statusText, "Unprocessable Entity");
            assert.equal(error.headers["content-type"], "application/json");
            assert.equal(error.headers["x-request-id"], "local-error-123");
            assert.deepEqual(error.body, {
              code: "invalid_request",
              message: "Email is required",
            });
            assert.equal(error.url, `${baseUrl}/users/1?source=unit`);

            return true;
          },
        );
      },
    );
  });

  it("surfaces non-JSON HTTP error payloads", async () => {
    await withTestServer(
      async (_req, res) => {
        res.writeHead(500, {
          "content-type": "text/plain",
          "x-request-id": "local-text-error-123",
        });
        res.end("upstream unavailable");
      },
      async (baseUrl) => {
        await assert.rejects(
          request({
            method: "GET",
            url: `${baseUrl}/unavailable`,
            logger: false,
          }),
          (error) => {
            assert.ok(error instanceof HttpRequestError);
            assert.equal(error.status, 500);
            assert.equal(error.statusText, "Internal Server Error");
            assert.equal(error.headers["content-type"], "text/plain");
            assert.equal(error.headers["x-request-id"], "local-text-error-123");
            assert.equal(error.body, "upstream unavailable");
            assert.equal(error.url, `${baseUrl}/unavailable`);

            return true;
          },
        );
      },
    );
  });

  it("returns HTTP error responses when throwOnHttpError is false", async () => {
    await withTestServer(
      async (_req, res) => {
        res.writeHead(404, { "content-type": "application/json" });
        res.end(JSON.stringify({ code: "not_found" }));
      },
      async (baseUrl) => {
        const result = await request({
          method: "GET",
          url: `${baseUrl}/missing`,
          throwOnHttpError: false,
          logger: false,
        });

        assert.equal(result.status, 404);
        assert.equal(result.ok, false);
        assert.deepEqual(result.data, { code: "not_found" });
      },
    );
  });

  it("returns non-JSON text responses as text", async () => {
    await withTestServer(
      async (_req, res) => {
        res.writeHead(200, {
          "content-type": "text/plain",
          "x-response-kind": "plain",
        });
        res.end("plain text response");
      },
      async (baseUrl) => {
        const result = await request({
          method: "GET",
          url: `${baseUrl}/plain`,
          logger: false,
        });

        assert.equal(result.status, 200);
        assert.equal(result.ok, true);
        assert.equal(result.headers["content-type"], "text/plain");
        assert.equal(result.headers["x-response-kind"], "plain");
        assert.equal(result.data, "plain text response");
      },
    );
  });

  it("returns undefined data for 204 and HEAD responses", async () => {
    await withTestServer(
      async (req, res) => {
        if (req.url === "/empty") {
          assert.equal(req.method, "DELETE");
          res.writeHead(204, { "x-response-kind": "no-content" });
          res.end();
          return;
        }

        if (req.url === "/head") {
          assert.equal(req.method, "HEAD");
          assert.equal(req.headers["x-client"], "head-client");
          assert.equal(req.headers["x-request"], "head-request");
          res.writeHead(200, { "x-response-kind": "head" });
          res.end();
          return;
        }

        res.writeHead(404);
        res.end();
      },
      async (baseUrl) => {
        const noContentResult = await request({
          method: "DELETE",
          url: `${baseUrl}/empty`,
          logger: false,
        });

        assert.equal(noContentResult.status, 204);
        assert.equal(noContentResult.ok, true);
        assert.equal(noContentResult.headers["x-response-kind"], "no-content");
        assert.equal(noContentResult.data, undefined);

        const client = createClient({
          baseUrl,
          headers: new Headers([["x-client", "head-client"]]),
          logger: false,
        });
        const headResult = await client.headRequest("/head", {
          headers: [["x-request", "head-request"]],
        });

        assert.equal(headResult.status, 200);
        assert.equal(headResult.ok, true);
        assert.equal(headResult.headers["x-response-kind"], "head");
        assert.equal(headResult.data, undefined);
      },
    );
  });

  it("detects invalid JSON", async () => {
    await withTestServer(
      async (_req, res) => {
        res.writeHead(200, {
          "content-type": "application/json",
          "x-request-id": "invalid-json-123",
        });
        res.end("{invalid-json");
      },
      async (baseUrl) => {
        await assert.rejects(
          request({
            method: "GET",
            url: `${baseUrl}/invalid-json`,
            logger: false,
          }),
          (error) => {
            assert.ok(error instanceof InvalidJsonResponseError);
            assert.equal(error.status, 200);
            assert.equal(error.statusText, "OK");
            assert.equal(error.headers["content-type"], "application/json");
            assert.equal(error.headers["x-request-id"], "invalid-json-123");
            assert.equal(error.body, "{invalid-json");
            assert.equal(error.url, `${baseUrl}/invalid-json`);
            assert.ok(error.cause instanceof SyntaxError);

            return true;
          },
        );
      },
    );
  });

  it("aborts when timeoutMs elapses", async () => {
    await withTestServer(
      async (_req, res) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      },
      async (baseUrl) => {
        await assert.rejects(
          request({
            method: "GET",
            url: `${baseUrl}/slow`,
            timeoutMs: 1,
            logger: false,
          }),
          { name: "TimeoutError" },
        );
      },
    );
  });
});

async function withTestServer(handler, test) {
  const server = createServer(async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.stack : String(error),
        }),
      );
    }
  });

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    await test(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

async function readRequestJson(req) {
  const text = await readRequestText(req);

  return JSON.parse(text);
}

async function readRequestText(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}
