import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InvalidJsonResponseError, request } from "../../dist/index.js";
import { assertRejectsWithError } from "../helpers/errors.js";
import { sendText, withLocalHttpServer } from "../helpers/server.js";

describe("invalid responses", () => {
  it("detects invalid JSON", async () => {
    await withLocalHttpServer(
      async (_req, res) => {
        sendText(res, 200, "{invalid-json", {
          "content-type": "application/json",
          "x-request-id": "invalid-json-123",
        });
      },
      async (baseUrl) => {
        await assertRejectsWithError(
          request({
            method: "GET",
            url: `${baseUrl}/invalid-json`,
            logger: false,
          }),
          InvalidJsonResponseError,
          (error) => {
            assert.equal(error.status, 200);
            assert.equal(error.statusText, "OK");
            assert.equal(error.headers["content-type"], "application/json");
            assert.equal(error.headers["x-request-id"], "invalid-json-123");
            assert.equal(error.body, "{invalid-json");
            assert.equal(error.url, `${baseUrl}/invalid-json`);
            assert.ok(error.cause instanceof SyntaxError);
          },
        );
      },
    );
  });
});
