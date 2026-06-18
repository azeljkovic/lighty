import { describe, it } from "node:test";
import { lightyAssert as lightyAssertRuntime } from "../dist/index.js";
import { client } from "./client.js";

/** @type {typeof import("../src/assertions/index.js")} */
const lightyAssert = lightyAssertRuntime;

describe("returns different redirect responses", () => {
  it("absolutely 302 redirects n times", async () => {
    const result = await client.getRequest("/absolute-redirect/2");

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // redirect
    lightyAssert.redirectedTo(result, "/get");
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "application/json");
    // body
    lightyAssert.bodyHasProperty(result, "url");
  });

  it("302 redirects to the given URL", async () => {
    const result = await client.getRequest("/redirect-to", {
      params: {
        url: "/get",
        status_code: 302,
      },
    });

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // redirect
    lightyAssert.redirectedTo(result, "/get");
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "application/json");
    // body
    lightyAssert.bodyContains(result, {
      args: {},
    });
  });

  it("302 redirects n times", async () => {
    const result = await client.getRequest("/redirect/2");

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // redirect
    lightyAssert.redirectedTo(result, "/get");
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "application/json");
    // body
    lightyAssert.bodyHasProperty(result, "url");
  });

  it("relatively 302 redirects n times", async () => {
    const result = await client.getRequest("/relative-redirect/2");

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // redirect
    lightyAssert.redirectedTo(result, "/get");
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "application/json");
    // body
    lightyAssert.bodyHasProperty(result, "url");
  });
});
