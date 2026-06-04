import { describe, it } from "node:test";
import { lightyAssert as lightyAssertRuntime } from "../dist/index.js";
import { client } from "./client.js";

/** @type {typeof import("../src/assertions/index.js")} */
const lightyAssert = lightyAssertRuntime;

describe("HTTP methods", () => {
  it("makes a GET request", async () => {
    const result = await client.getRequest("/get?wh=4");

    // response code
    lightyAssert.responseIsSuccessful(result.response);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(result, "content-type", "application/json");
    // body
    lightyAssert.bodyEquals(result, {
      args: { wh: "4" },
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "*",
        Connection: "keep-alive",
        Host: "localhost",
        "Sec-Fetch-Mode": "cors",
        "User-Agent": "node",
      },
      origin: "192.168.65.1",
      url: "http://localhost/get?wh=4",
    });
  });

  it("makes a POST request", async () => {
    const result = await client.postRequest("/post?wh=4", {
      params: { source: "unit" },
      body: {
        name: "Ada Lovelace",
        email: "ada@example.test",
      },
    });

    // response code
    lightyAssert.statusCodeIsInRange(result, 200, 205);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(result, "content-type", "application/json");
    // body
    lightyAssert.bodyContains(result, {
      headers: { "Accept-Encoding": "gzip, deflate" },
    });
  });

  it("makes a PATCH request", async () => {
    const result = await client.patchRequest("/patch", {
      body: {
        name: "Ada Lovelace",
        email: "ada@example.test",
      },
    });

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    lightyAssert.headerIs(result, "content-type", "application/json");
    lightyAssert.headerIncludes(result, "content-type", "application/json");
    // body
    lightyAssert.bodyContains(result, {
      headers: { "Accept-Encoding": "gzip, deflate" },
    });
    lightyAssert.bodyHasLength(result.data.data, 50);
  });

  it("makes a PUT request", async () => {
    const result = await client.putRequest("/put", {
      body: {
        name: "Ada Lovelace",
        email: "ada@example.test",
      },
    });

    // response code
    lightyAssert.statusCodeIs2xx(result);
    // headers
    lightyAssert.headerMatches(result, "Content-Type", /^application\//);
    // body
    lightyAssert.bodyContains(result, {
      headers: { "Accept-Encoding": "gzip, deflate" },
    });
    lightyAssert.bodyHasLength(result.data.data, 50);
  });

  it("makes a DELETE request", async () => {
    const result = await client.deleteRequest("/delete", {});

    // response code
    lightyAssert.responseIsOk(result);
    // headers
    lightyAssert.headerSatisfies(
      result,
      "content-length",
      (v) => Number(v) > 300,
    );
    // body
    lightyAssert.bodyContains(result, {
      headers: { "Accept-Encoding": "gzip, deflate" },
    });
    lightyAssert.bodyHasLength(result.data.data, 0);
  });

  it("makes a HEAD request", async () => {
    const result = await client.headRequest("/get", {});

    // response code
    lightyAssert.statusCodeIsOneOf(result, [200, 201, 202]);
    // body
    lightyAssert.bodyIsNoContent(result);
  });
});
