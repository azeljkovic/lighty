import { describe, it } from "node:test";
import { lightyAssert as lightyAssertRuntime } from "../dist/index.js";
import { client } from "./client.js";

/** @type {typeof import("../src/assertions/index.js")} */
const lightyAssert = lightyAssertRuntime;

describe("Response inspection", () => {
  it("cache", async () => {
    const result = await client.getRequest("/cache", {
      headers: {
        "If-Modified-Since": "Wed, 21 Oct 2015 07:28:00 GMT",
      },
    });

    // response code
    lightyAssert.statusCodeIs(result, 304);
    // headers
    lightyAssert.headerExists(result, "server");
  });

  it("cache control", async () => {
    const timeValue = 30;
    const result = await client.getRequest(`/cache/${timeValue}`, {});

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(
      result,
      "cache-control",
      `public, max-age=${timeValue}`,
    );
  });

  it("etag", async () => {
    const etag = "fdsdffs";
    const result = await client.getRequest(`/etag/${etag}`, {
      headers: {
        "If-None-Match": `${etag}`,
      },
    });

    // response code
    lightyAssert.statusCodeIs(result, 304);
    // headers
    lightyAssert.headerExists(result, "server");
  });

  it("response headers", async () => {
    const headerName1 = "nm";
    const headerValue1 = "v";
    const headerName2 = "nm2";
    const headerValue2 = "v2";
    const result = await client.getRequest("/response-headers", {
      params: {
        [headerName1]: headerValue1,
        [headerName2]: headerValue2,
      },
    });

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIncludes(result, headerName1, headerValue1);
    lightyAssert.headerIncludes(result, headerName2, headerValue2);
    // body
    lightyAssert.bodyContains(result, {
      [headerName1]: headerValue1,
      [headerName2]: headerValue2,
    });
  });
});
