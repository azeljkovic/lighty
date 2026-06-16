import { describe, it } from "node:test";
import { lightyAssert as lightyAssertRuntime } from "../dist/index.js";
import { client } from "./client.js";

/** @type {typeof import("../src/assertions/index.js")} */
const lightyAssert = lightyAssertRuntime;

describe("works with cookies", () => {
  it("returns cookie data", async () => {
    const result = await client.getRequest("/cookies", {
      headers: {
        Cookie: "session=lighty; theme=dark",
      },
    });

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "application/json");
    // body
    lightyAssert.bodyEquals(result, {
      cookies: {
        session: "lighty",
        theme: "dark",
      },
    });
  });

  it("deletes cookies provided by query parameters", async () => {
    const result = await client.getRequest("/cookies/delete", {
      params: {
        session: "123",
        theme: "light",
      },
    });

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // redirect
    lightyAssert.redirectedTo(result, "/cookies");
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "application/json");
    // body
    lightyAssert.bodyEquals(result, { cookies: {} });
  });

  it("sets cookies provided by query parameters", async () => {
    const result = await client.getRequest("/cookies/set", {
      params: {
        session: "lighty",
        theme: "dark",
      },
    });

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // redirect
    lightyAssert.redirectedTo(result, "/cookies");
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "application/json");
    // body
    lightyAssert.bodyEquals(result, { cookies: {} });
  });

  it.only("sets a cookie using path parameters", async () => {
    const result = await client.getRequest("/cookies/set/session/lighty", {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // redirect
    lightyAssert.redirectedTo(result, "/cookies");
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerContentTypeIs(result, "application/json");
    // body
    lightyAssert.bodyEquals(result, { cookies: {} });
  });
});
