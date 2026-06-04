import { describe, it } from "node:test";
import { lightyAssert as lightyAssertRuntime } from "../dist/index.js";
import { client } from "./client.js";

/** @type {typeof import("../src/assertions/index.js")} */
const lightyAssert = lightyAssertRuntime;

describe("Status codes", () => {
  it("responseIsOk", async () => {
    const result = await client.getRequest("/status/200");

    lightyAssert.responseIsOk(result);
  });

  it("responseIsSuccessful", async () => {
    const result = await client.getRequest("/status/204");

    lightyAssert.responseIsSuccessful(result);
  });

  it("responseIsCreated", async () => {
    const result = await client.getRequest("/status/201");

    lightyAssert.responseIsCreated(result);
  });

  it("responseIsAccepted", async () => {
    const result = await client.getRequest("/status/202");

    lightyAssert.responseIsAccepted(result);
  });

  it("responseIsNoContent", async () => {
    const result = await client.getRequest("/status/204");

    lightyAssert.responseIsNoContent(result);
    lightyAssert.bodyIsNoContent(result);
  });

  it("responseIsRedirect", async () => {
    const result = await client.getRequest("/status/304");

    lightyAssert.responseIsRedirect(result);
  });

  it("responseIsBadRequest", async () => {
    const result = await client.getRequest("/status/400");

    lightyAssert.responseIsBadRequest(result);
  });

  it("responseIsUnauthorized", async () => {
    const result = await client.getRequest("/status/401");

    lightyAssert.responseIsUnauthorized(result);
  });

  it("responseIsForbidden", async () => {
    const result = await client.getRequest("/status/403");

    lightyAssert.responseIsForbidden(result);
  });

  it("responseIsNotFound", async () => {
    const result = await client.getRequest("/status/404");

    lightyAssert.responseIsNotFound(result);
  });

  it("responseIsConflict", async () => {
    const result = await client.getRequest("/status/409");

    lightyAssert.responseIsConflict(result);
  });

  it("responseIsUnprocessableEntity", async () => {
    const result = await client.getRequest("/status/422");

    lightyAssert.responseIsUnprocessableEntity(result);
  });

  it("responseIsTooManyRequests", async () => {
    const result = await client.getRequest("/status/429");

    lightyAssert.responseIsTooManyRequests(result);
  });

  it("responseIsClientError", async () => {
    const result = await client.getRequest("/status/404");

    lightyAssert.responseIsClientError(result);
  });

  it("responseIsServerError", async () => {
    const result = await client.getRequest("/status/503");

    lightyAssert.responseIsServerError(result);
  });

  it("status code ranges", async () => {
    const success = await client.getRequest("/status/204");
    const redirect = await client.getRequest("/status/304");
    const clientError = await client.getRequest("/status/404");
    const serverError = await client.getRequest("/status/503");

    lightyAssert.statusCodeIs2xx(success);
    lightyAssert.statusCodeIs3xx(redirect);
    lightyAssert.statusCodeIs(redirect, 304);
    lightyAssert.statusCodeIs4xx(clientError);
    lightyAssert.statusCodeIs5xx(serverError);
  });
});
