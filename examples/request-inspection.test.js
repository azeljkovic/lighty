import { describe, it } from "node:test";
import { lightyAssert as lightyAssertRuntime } from "../dist/index.js";
import { client } from "./client.js";

/** @type {typeof import("../src/assertions/index.js")} */
const lightyAssert = lightyAssertRuntime;

describe("Request inspection", () => {
  it("headers", async () => {
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

  it("ip", async () => {
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

  it("user-agent", async () => {
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
