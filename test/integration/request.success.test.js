import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createClient, customRequest } from "../../dist/index.js";
import { sendEmpty, sendText, withLocalHttpServer } from "../helpers/server.js";

describe("successful responses", () => {
  it("returns non-JSON text responses as text", async () => {
    await withLocalHttpServer(
      async (_req, res) => {
        sendText(res, 200, "plain text response", {
          "x-response-kind": "plain",
        });
      },
      async (baseUrl) => {
        const result = await customRequest({
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

  it("returns undefined data for 204 responses", async () => {
    await withLocalHttpServer(
      async (req, res) => {
        assert.equal(req.method, "DELETE");
        assert.equal(req.url, "/empty");
        sendEmpty(res, 204, { "x-response-kind": "no-content" });
      },
      async (baseUrl) => {
        const result = await customRequest({
          method: "DELETE",
          url: `${baseUrl}/empty`,
          logger: false,
        });

        assert.equal(result.status, 204);
        assert.equal(result.ok, true);
        assert.equal(result.headers["x-response-kind"], "no-content");
        assert.equal(result.data, undefined);
      },
    );
  });

  it("returns undefined data for HEAD responses", async () => {
    await withLocalHttpServer(
      async (req, res) => {
        assert.equal(req.method, "HEAD");
        assert.equal(req.url, "/head");
        assert.equal(req.headers["x-client"], "head-client");
        assert.equal(req.headers["x-request"], "head-request");
        sendEmpty(res, 200, { "x-response-kind": "head" });
      },
      async (baseUrl) => {
        const client = createClient({
          baseUrl,
          headers: new Headers([["x-client", "head-client"]]),
          logger: false,
        });
        const result = await client.headRequest("/head", {
          headers: [["x-request", "head-request"]],
        });

        assert.equal(result.status, 200);
        assert.equal(result.ok, true);
        assert.equal(result.headers["x-response-kind"], "head");
        assert.equal(result.data, undefined);
      },
    );
  });
});
