import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createClient } from "../../dist/index.js";
import {
  readJsonBody,
  sendJson,
  withLocalHttpServer,
} from "../helpers/server.js";

describe("outgoing requests", () => {
  it("sends method, query params, headers, and JSON body", async () => {
    await withLocalHttpServer(
      async (req, res) => {
        assert.equal(req.method, "POST");
        assert.equal(req.url, "/users?active=true&role=admin&role=editor");
        assert.equal(req.headers.accept, "application/json");
        assert.equal(req.headers["content-type"], "application/json");
        assert.equal(req.headers.authorization, "Bearer request-token");
        assert.equal(req.headers["x-client"], "client");
        assert.equal(req.headers["x-request"], "request");
        assert.deepEqual(await readJsonBody(req), { name: "Ada" });

        sendJson(
          res,
          201,
          { id: 1, name: "Ada" },
          { "x-request-id": "local-request-123" },
        );
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
});
