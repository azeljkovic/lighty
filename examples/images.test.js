import { describe, it } from "node:test";
import { lightyAssert as lightyAssertRuntime } from "../dist/index.js";
import { client } from "./client.js";

/** @type {typeof import("../src/assertions/index.js")} */
const lightyAssert = lightyAssertRuntime;

describe("returns different image formats", () => {
  it("returns a simple image of the type suggested by the Accept header", async () => {
    const result = await client.getRequest("/image", {
      headers: {
        Accept: "image/png",
      },
      responseType: "arrayBuffer",
    });

    // response code
    lightyAssert.responseIsOk(result);
    // headers
    lightyAssert.headerExists(result, "server");
    // body
    lightyAssert.bodyIsPng(result);
  });

  it("returns a simple PNG image", async () => {
    const result = await client.getRequest("/image/png", {
      responseType: "arrayBuffer",
    });

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    // body
    lightyAssert.bodyIsPng(result);
  });

  it("returns a simple JPEG image", async () => {
    const result = await client.getRequest("/image/jpeg", {
      responseType: "arrayBuffer",
    });

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    // body
    lightyAssert.bodyIsJpeg(result);
  });

  it("returns a simple WEBP image", async () => {
    const result = await client.getRequest("/image/webp", {
      responseType: "arrayBuffer",
    });

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    // body
    lightyAssert.bodyIsWebp(result);
  });

  it("returns a simple SVG image", async () => {
    const result = await client.getRequest("/image/svg", {
      responseType: "text",
    });

    // response code
    lightyAssert.statusCodeIs(result, 200);
    // headers
    lightyAssert.headerExists(result, "server");
    // body
    lightyAssert.bodyIsSvg(result);
  });
});
