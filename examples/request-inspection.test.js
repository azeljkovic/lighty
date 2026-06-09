import { describe, it } from "node:test";
import { lightyAssert as lightyAssertRuntime } from "../dist/index.js";
import { client } from "./client.js";

/** @type {typeof import("../src/assertions/index.js")} */
const lightyAssert = lightyAssertRuntime;

describe("inspect the request data", () => {
  it("return the incoming request's HTTP headers", async () => {
    // const result = await client.getRequest("/headers");
    const result = await client.customRequest({
      method: "GET",
      url: "/headers",
    });

    // response code
    lightyAssert.responseIsSuccessful(result.response);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(result, "content-type", "application/json");
    // body
    lightyAssert.bodyEquals(result, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "*",
        Connection: "keep-alive",
        Host: "localhost",
        "Sec-Fetch-Mode": "cors",
        "User-Agent": "node",
      },
    });
  });

  it("returns the requester's IP Address", async () => {
    const result = await client.customRequest({
      method: "GET",
      url: "/ip",
    });

    // response code
    lightyAssert.responseIsSuccessful(result.response);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(result, "content-type", "application/json");
    // body
    lightyAssert.bodyHasProperty(result, "origin");
  });

  it("return the incoming requests's User-Agent header", async () => {
    const result = await client.customRequest({
      method: "GET",
      url: "/user-agent",
    });

    // response code
    lightyAssert.responseIsSuccessful(result.response);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(result, "content-type", "application/json");
    // body
    lightyAssert.bodyHasProperty(result, "user-agent");
  });
});
