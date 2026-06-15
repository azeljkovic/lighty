import { describe, it } from "node:test";
import { Buffer } from "node:buffer";
import { lightyAssert as lightyAssertRuntime } from "../dist/index.js";
import { client } from "./client.js";
import assert from "node:assert/strict";

/** @type {typeof import("../src/assertions/index.js")} */
const lightyAssert = lightyAssertRuntime;

describe("generates random and dynamic data", () => {
  it("decodes base64url-encoded string", async () => {
    const secret = "lighty is awesome!";
    const urlSafeEncoded = Buffer.from(secret).toString("base64url");

    const result = await client.getRequest(`/base64/${urlSafeEncoded}`, {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    // body
    lightyAssert.bodyTextMatches(result, secret);
  });

  it("returns n random bytes generated with given seed", async () => {
    const n = 15;

    const result = await client.getRequest(`/bytes/${n}`, {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIncludes(
      result,
      "content-type",
      "application/octet-stream",
    );
    // body
    assert.ok(result.data instanceof ArrayBuffer);
    assert.equal(result.data.byteLength, n);
  });

  it("returns a delayed response (lighty timeout)", async () => {
    const delay = 10;

    await assert.rejects(client.getRequest(`/delay/${delay}`, {}), {
      name: "TimeoutError",
    });
  });

  it("returns a delayed response (3 seconds)", async () => {
    const delay = 3;

    const result = await client.getRequest(`/delay/${delay}`, {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "application/json");
  });

  it("drips data over a duration after an optional initial delay", async () => {
    const duration = 1;
    const bytes = 15;

    const result = await client.getRequest("/drip", {
      params: {
        duration: duration,
        numbytes: bytes,
      },
    });

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "application/octet-stream");
    // body
    assert.ok(result.data instanceof ArrayBuffer);
    assert.equal(result.data.byteLength, bytes);
  });

  it("generate a page containing n links to other pages which do the same", async () => {
    const n = 3;
    const offset = 4;
    const body =
      "<html><head><title>Links</title></head><body>" +
      "<a href='/links/3/0'>0</a> " +
      "<a href='/links/3/1'>1</a> " +
      "<a href='/links/3/2'>2</a> " +
      "</body></html>";

    const result = await client.getRequest(`/links/${n}/${offset}`, {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "text/html; charset=utf-8");
    // body
    lightyAssert.bodyEquals(result, body);
  });

  it("returns a range of bytes", async () => {
    const bytes = 15;

    const result = await client.getRequest(`/range/${bytes}`, {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "application/octet-stream");
    lightyAssert.headerIs(
      result,
      "content-range",
      `bytes 0-${bytes - 1}/${bytes}`,
    );
    // body
    assert.ok(result.data instanceof ArrayBuffer);
    assert.equal(result.data.byteLength, bytes);
    assert.equal(new TextDecoder().decode(result.data), "abcdefghijklmno");
  });

  it("streams n random bytes generated with given seed", async () => {
    const bytes = 15;

    const result = await client.getRequest(`/stream-bytes/${bytes}`, {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "application/octet-stream");
    // body
    assert.ok(result.data instanceof ArrayBuffer);
    assert.equal(result.data.byteLength, bytes);
  });

  it("streams n JSON responses", async () => {
    const count = 3;

    const result = await client.getRequest(`/stream/${count}`, {
      responseType: "text",
    });

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "application/json");
    // body
    const responses = result.data
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    assert.equal(responses.length, count);
    assert.deepEqual(
      responses.map(({ id }) => id),
      [0, 1, 2],
    );
  });

  it("returns a UUID4", async () => {
    const result = await client.getRequest("/uuid", {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "application/json");
    // body
    assert.match(
      result.data.uuid,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
