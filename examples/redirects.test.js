import { describe, it } from "node:test";
import { lightyAssert as lightyAssertRuntime } from "../dist/index.js";
import { client } from "./client.js";
import assert from "node:assert/strict";

/** @type {typeof import("../src/assertions/index.js")} */
const lightyAssert = lightyAssertRuntime;

describe("returns different redirect responses", () => {
  it("follows redirects to the final response", async () => {
    const result = await client.getRequest("/redirect-to", {
      params: {
        url: "/get",
        status_code: 302,
      },
    });

    lightyAssert.responseWasRedirectedTo(result, "/get");
    lightyAssert.statusCodeIs(result, 200);
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "application/json");
  });

  it("absolutely 302 redirects n times", async () => {
    const result = await client.getRequest("/absolute-redirect/2", {
      redirect: "manual",
      responseType: "text",
    });

    lightyAssert.responseRedirectsTo(result, "/absolute-redirect/1");
    assert.match(result.headers.location, /^https?:\/\//);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIncludes(result, "content-type", "text/html");
  });

  it("302 redirects to the given URL", async () => {
    const result = await client.getRequest("/redirect-to", {
      redirect: "manual",
      responseType: "text",
      params: {
        url: "/get",
        status_code: 302,
      },
    });

    lightyAssert.responseRedirectsTo(result, "/get");
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIncludes(result, "content-type", "text/html");
  });

  it("302 redirects n times", async () => {
    const result = await client.getRequest("/redirect/2", {
      redirect: "manual",
      responseType: "text",
    });

    lightyAssert.responseRedirectsTo(result, "/relative-redirect/1");
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIncludes(result, "content-type", "text/html");
  });

  it("relatively 302 redirects n times", async () => {
    const result = await client.getRequest("/relative-redirect/2", {
      redirect: "manual",
      responseType: "text",
    });

    lightyAssert.responseRedirectsTo(result, "/relative-redirect/1");
    assert.doesNotMatch(result.headers.location, /^https?:\/\//);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIncludes(result, "content-type", "text/html");
  });
});
