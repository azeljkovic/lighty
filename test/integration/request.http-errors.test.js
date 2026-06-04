import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HttpRequestError, customRequest } from "../../dist/index.js";
import { assertRejectsWithError } from "../helpers/errors.js";
import {
  readJsonBody,
  sendJson,
  sendText,
  withLocalHttpServer,
} from "../helpers/server.js";

describe("HTTP errors", () => {
  it("surfaces HTTP error response details", async () => {
    await withLocalHttpServer(
      async (req, res) => {
        assert.equal(req.method, "PATCH");
        assert.equal(req.url, "/users/1?source=unit");
        assert.deepEqual(await readJsonBody(req), { email: "" });

        sendJson(
          res,
          422,
          {
            code: "invalid_request",
            message: "Email is required",
          },
          { "x-request-id": "local-error-123" },
        );
      },
      async (baseUrl) => {
        await assertRejectsWithError(
          customRequest({
            method: "PATCH",
            url: `${baseUrl}/users/1`,
            params: { source: "unit" },
            body: { email: "" },
            logger: false,
          }),
          HttpRequestError,
          (error) => {
            assert.equal(error.status, 422);
            assert.equal(error.statusText, "Unprocessable Entity");
            assert.equal(error.headers["content-type"], "application/json");
            assert.equal(error.headers["x-request-id"], "local-error-123");
            assert.deepEqual(error.body, {
              code: "invalid_request",
              message: "Email is required",
            });
            assert.equal(error.url, `${baseUrl}/users/1?source=unit`);
          },
        );
      },
    );
  });

  it("surfaces non-JSON HTTP error payloads", async () => {
    await withLocalHttpServer(
      async (_req, res) => {
        sendText(res, 500, "upstream unavailable", {
          "x-request-id": "local-text-error-123",
        });
      },
      async (baseUrl) => {
        await assertRejectsWithError(
          customRequest({
            method: "GET",
            url: `${baseUrl}/unavailable`,
            logger: false,
          }),
          HttpRequestError,
          (error) => {
            assert.equal(error.status, 500);
            assert.equal(error.statusText, "Internal Server Error");
            assert.equal(error.headers["content-type"], "text/plain");
            assert.equal(error.headers["x-request-id"], "local-text-error-123");
            assert.equal(error.body, "upstream unavailable");
            assert.equal(error.url, `${baseUrl}/unavailable`);
          },
        );
      },
    );
  });

  it("returns HTTP error responses when throwOnHttpError is false", async () => {
    await withLocalHttpServer(
      async (_req, res) => {
        sendJson(res, 404, { code: "not_found" });
      },
      async (baseUrl) => {
        const result = await customRequest({
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
});
