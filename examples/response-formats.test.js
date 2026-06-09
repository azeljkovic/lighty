import { describe, it } from "node:test";
import { lightyAssert as lightyAssertRuntime } from "../dist/index.js";
import { client } from "./client.js";
import assert from "node:assert/strict";

/** @type {typeof import("../src/assertions/index.js")} */
const lightyAssert = lightyAssertRuntime;

describe("returns responses in different data formats", () => {
  it("returns Brotli-encoded data", async () => {
    const result = await client.getRequest("/brotli", {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(result, "content-encoding", "br");
  });

  it("returns Deflate-encoded data", async () => {
    const result = await client.getRequest("/deflate", {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(result, "content-encoding", "deflate");
  });

  it("returns page denied by robots.txt rules", async () => {
    const result = await client.getRequest("/deny", {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(result, "content-type", "text/plain");
    // body
    lightyAssert.bodyTextContains(result, "YOU SHOULDN'T BE HERE");
  });

  it("returns a UTF-8 encoded body", async () => {
    const result = await client.getRequest("/encoding/utf8", {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(result, "content-type", "text/html; charset=utf-8");
    // body
    lightyAssert.bodyTextContains(result, "Unicode Demo");
  });

  it("returns GZip-encoded data", async () => {
    const result = await client.getRequest("/gzip", {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(result, "content-type", "application/json");
    lightyAssert.headerIs(result, "content-encoding", "gzip");
  });

  it("returns a simple HTML document", async () => {
    const result = await client.getRequest("/html", {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(result, "content-type", "text/html; charset=utf-8");
    // body
    lightyAssert.bodyTextContains(result, "<!DOCTYPE html>");
  });

  it("returns a simple JSON document", async () => {
    const result = await client.getRequest("/json", {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(result, "content-type", "application/json");
    // body
    assert.equal(
      result.data.slideshow.slides[1].items[0],
      "Why <em>WonderWidgets</em> are great",
    );
    assert.equal(
      result.data.slideshow.slides[1].items[1],
      "Who <em>buys</em> WonderWidgets",
    );
  });

  it("returns some robots.txt rules", async () => {
    const result = await client.getRequest("/robots.txt", {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(result, "content-type", "text/plain");
    // body
    lightyAssert.bodyTextMatches(result, "User-agent: *\nDisallow: /deny\n");
  });

  it("returns a simple XML document", async () => {
    const result = await client.getRequest("/xml", {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(result, "content-type", "application/xml");
    // body
    lightyAssert.bodyTextContains(
      result,
      "<?xml version='1.0' encoding='us-ascii'?>",
    );
  });
});
