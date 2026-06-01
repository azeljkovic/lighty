import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { request } from "../../dist/index.js";
import { sendJson, withLocalHttpServer } from "../helpers/server.js";

describe("timeouts", () => {
  it("aborts when timeoutMs elapses", async () => {
    await withLocalHttpServer(
      async (_req, res) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        sendJson(res, 200, { ok: true });
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
