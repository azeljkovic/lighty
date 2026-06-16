import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lightyAssert } from "../../dist/index.js";
import { makeResponse, makeResult } from "../helpers/responses.js";

describe("response assertions", () => {
  it("passes for expected response status helpers", () => {
    lightyAssert.responseIsOk(makeResult(200));
    lightyAssert.responseIsSuccessful(makeResult(299));
    lightyAssert.responseIsCreated(makeResult(201));
    lightyAssert.responseIsAccepted(makeResult(202));
    lightyAssert.responseIsNoContent(makeResult(204));
    lightyAssert.responseIsRedirect(makeResult(302));
    lightyAssert.redirectedTo(
      {
        status: 200,
        headers: new Headers(),
        redirected: true,
        url: "https://example.test/cookies?session=lighty",
      },
      "/cookies",
    );
    lightyAssert.responseIsBadRequest(makeResult(400));
    lightyAssert.responseIsUnauthorized(makeResult(401));
    lightyAssert.responseIsForbidden(makeResult(403));
    lightyAssert.responseIsNotFound(makeResult(404));
    lightyAssert.responseIsClientError(makeResult(409));
    lightyAssert.responseIsConflict(makeResult(409));
    lightyAssert.responseIsUnprocessableEntity(makeResult(422));
    lightyAssert.responseIsTooManyRequests(makeResult(429));
    lightyAssert.responseIsServerError(makeResult(503));
    lightyAssert.statusCodeIs(makeResult(202), 202);
    lightyAssert.statusCodeIs2xx(makeResult(204));
    lightyAssert.statusCodeIs3xx(makeResult(304));
    lightyAssert.statusCodeIs4xx(makeResult(404));
    lightyAssert.statusCodeIs5xx(makeResult(503));
    lightyAssert.statusCodeIsOneOf(makeResult(204), [200, 201, 204]);
    lightyAssert.statusCodeIsInRange(makeResult(299), 200, 299);
  });

  it("passes when given a raw Response", () => {
    lightyAssert.responseIsOk(makeResponse(200));
    lightyAssert.statusCodeIs(makeResponse(204), 204);
  });

  it("throws for unexpected statuses", () => {
    const detailedResponse = {
      status: 409,
      statusText: "Conflict",
      url: "https://example.test/users",
      headers: new Headers(),
    };

    assert.throws(
      () => lightyAssert.statusCodeIs(detailedResponse, 200),
      /Response status 409 Conflict from 'https:\/\/example\.test\/users' does not match the expected status code 200/,
    );
    assert.throws(
      () => lightyAssert.responseIsOk(makeResult(500)),
      /outside of range 200-299/,
    );
    assert.throws(
      () => lightyAssert.responseIsSuccessful(makeResult(300)),
      /was not between 200 and 299/,
    );
    assert.throws(
      () => lightyAssert.responseIsCreated(makeResult(200)),
      /does not match the expected status code 201/,
    );
    assert.throws(
      () => lightyAssert.responseIsAccepted(makeResult(200)),
      /does not match the expected status code 202/,
    );
    assert.throws(
      () => lightyAssert.responseIsNoContent(makeResult(200)),
      /does not match the expected status code 204/,
    );
    assert.throws(
      () => lightyAssert.responseIsRedirect(makeResult(200)),
      /was not between 300 and 399/,
    );
    assert.throws(
      () =>
        lightyAssert.redirectedTo(
          {
            status: 200,
            headers: new Headers(),
            redirected: false,
            url: "https://example.test/users",
          },
          "/cookies",
        ),
      /Response was not redirected to '\/cookies'/,
    );
    assert.throws(
      () =>
        lightyAssert.redirectedTo(
          {
            status: 200,
            headers: new Headers(),
            redirected: true,
            url: "https://example.test/users",
          },
          "/cookies",
        ),
      /does not match the expected path '\/cookies'/,
    );
    assert.throws(
      () => lightyAssert.responseIsBadRequest(makeResult(200)),
      /does not match the expected status code 400/,
    );
    assert.throws(
      () => lightyAssert.responseIsUnauthorized(makeResult(200)),
      /does not match the expected status code 401/,
    );
    assert.throws(
      () => lightyAssert.responseIsForbidden(makeResult(200)),
      /does not match the expected status code 403/,
    );
    assert.throws(
      () => lightyAssert.responseIsNotFound(makeResult(200)),
      /does not match the expected status code 404/,
    );
    assert.throws(
      () => lightyAssert.responseIsClientError(makeResult(200)),
      /was not between 400 and 499/,
    );
    assert.throws(
      () => lightyAssert.responseIsConflict(makeResult(200)),
      /does not match the expected status code 409/,
    );
    assert.throws(
      () => lightyAssert.responseIsUnprocessableEntity(makeResult(200)),
      /does not match the expected status code 422/,
    );
    assert.throws(
      () => lightyAssert.responseIsTooManyRequests(makeResult(200)),
      /does not match the expected status code 429/,
    );
    assert.throws(
      () => lightyAssert.responseIsServerError(makeResult(400)),
      /was not between 500 and 599/,
    );
    assert.throws(
      () => lightyAssert.statusCodeIs(makeResult(200), 201),
      /does not match the expected status code 201/,
    );
    assert.throws(
      () => lightyAssert.statusCodeIs2xx(makeResult(300)),
      /was not between 200 and 299/,
    );
    assert.throws(
      () => lightyAssert.statusCodeIs3xx(makeResult(200)),
      /was not between 300 and 399/,
    );
    assert.throws(
      () => lightyAssert.statusCodeIs4xx(makeResult(500)),
      /was not between 400 and 499/,
    );
    assert.throws(
      () => lightyAssert.statusCodeIs5xx(makeResult(400)),
      /was not between 500 and 599/,
    );
    assert.throws(
      () => lightyAssert.statusCodeIsOneOf(makeResult(404), [200, 201]),
      /was not one of: 200, 201/,
    );
    assert.throws(
      () => lightyAssert.statusCodeIsInRange(makeResult(300), 200, 299),
      /was not between 200 and 299/,
    );
  });

  it("throws assertion failures for invalid response targets", () => {
    const message =
      /Expected response assertion target to be a Response or a request result/;

    for (const invalidTarget of [
      null,
      42,
      "not a response",
      {},
      { response: null },
      { response: { status: 200, headers: {} } },
    ]) {
      assert.throws(() => lightyAssert.responseIsOk(invalidTarget), {
        name: "AssertionError",
        message,
      });
    }
  });
});
