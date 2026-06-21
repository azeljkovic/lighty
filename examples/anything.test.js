import { describe, it } from "node:test";
import { lightyAssert as lightyAssertRuntime } from "../dist/index.js";
import { client } from "./client.js";

/** @type {typeof import("../src/assertions/index.js")} */
const lightyAssert = lightyAssertRuntime;

const params = {
  color: "ultraviolet",
  instrument: "violin",
};

const body = {
  color: "green",
  transparent: false,
};

describe("returns anything passed in request data", () => {
  it("echoes a POST request made to /anything", async () => {
    const result = await client.postRequest("/anything", {
      params: params,
      body: body,
    });

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerContentTypeIs(result, "application/json");
    // body
    lightyAssert.bodyContains(result, {
      args: params,
    });
    lightyAssert.bodyContains(result, {
      json: body,
    });
  });

  it("echoes a POST request made to /anything/{anything}", async () => {
    const result = await client.postRequest("/anything/field-notes/aurora-42", {
      params: params,
      body: body,
    });

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerContentTypeIs(result, "application/json");
    // body
    lightyAssert.bodyContains(result, {
      args: params,
    });
    lightyAssert.bodyContains(result, {
      json: body,
    });
  });
});
