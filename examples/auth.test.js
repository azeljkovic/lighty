import { describe, it } from "node:test";
import { lightyAssert as lightyAssertRuntime } from "../dist/index.js";
import { client } from "./client.js";

/** @type {typeof import("../src/assertions/index.js")} */
const lightyAssert = lightyAssertRuntime;

describe("auth methods", () => {
  it("prompts the user for authorization using HTTP Basic Auth - success", async () => {
    const username = "user";
    const password = "pass";

    // Encode credentials to Base64
    const encodedCredentials = btoa(`${username}:${password}`);

    const result = await client.getRequest(
      `/basic-auth/${username}/${password}`,
      {
        headers: {
          Authorization: `Basic ${encodedCredentials}`,
          "Content-Type": "application/json",
        },
      },
    );

    // response code
    lightyAssert.responseIsSuccessful(result);
    // response body
    lightyAssert.bodyEquals(result, { authenticated: true, user: username });
  });

  it("prompts the user for authorization using HTTP Basic Auth - wrong credentials", async () => {
    const username = "user";
    const password = "pass";

    // 1. Encode credentials to Base64
    const encodedCredentials = btoa(`${username}:${password}`);

    const result = await client.getRequest(
      `/basic-auth/${username}/wrong-pass`,
      {
        headers: {
          Authorization: `Basic ${encodedCredentials}`,
          "Content-Type": "application/json",
        },
      },
    );

    // response code
    lightyAssert.responseIsUnauthorized(result);
    // response body
    lightyAssert.bodyIsNoContent(result);
  });

  it("prompts the user for authorization using bearer authentication", async () => {
    const token = "tkn";

    const result = await client.getRequest(`/bearer`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // response code
    lightyAssert.responseIsSuccessful(result);
    // response body
    lightyAssert.bodyEquals(result, {
      authenticated: true,
      token: token,
    });
  });
});
