import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as lighty from "../../dist/index.js";
import { makeResult } from "../helpers/responses.js";

describe("namespace export", () => {
  it("exposes request helpers through direct and namespace exports", () => {
    const requestExportNames = [
      "createClient",
      "deleteRequest",
      "getRequest",
      "headRequest",
      "HttpRequestError",
      "InvalidJsonResponseError",
      "optionsRequest",
      "patchRequest",
      "postRequest",
      "putRequest",
      "customRequest",
    ];

    for (const exportName of requestExportNames) {
      assert.equal(typeof lighty[exportName], "function");
      assert.equal(lighty.lightyRequest[exportName], lighty[exportName]);
    }

    assert.deepEqual(
      Object.keys(lighty.lightyRequest).sort(),
      requestExportNames.sort(),
    );
  });

  it("exposes assertion helpers through direct and namespace exports", () => {
    const assertionExportNames = [
      "bodyArrayContains",
      "bodyArrayContainsItemMatching",
      "bodyArrayIsEmpty",
      "bodyArrayIsNotEmpty",
      "bodyArrayLengthIs",
      "bodyContains",
      "bodyEquals",
      "bodyHasLength",
      "bodyHasProperty",
      "bodyIncludesProperties",
      "bodyIsArray",
      "bodyIsNoContent",
      "bodyLengthIsAtLeast",
      "bodyLengthIsGreaterThan",
      "bodyMatches",
      "bodyObjectIsEmpty",
      "bodyPathEquals",
      "bodyTextContains",
      "bodyTextMatches",
      "headerContentTypeIs",
      "headerExists",
      "headerIncludes",
      "headerIs",
      "headerMatches",
      "headerSatisfies",
      "responseIsAccepted",
      "responseIsBadRequest",
      "responseIsClientError",
      "responseIsConflict",
      "responseIsCreated",
      "responseIsForbidden",
      "responseIsNoContent",
      "responseIsNotFound",
      "responseIsOk",
      "responseIsRedirect",
      "responseIsServerError",
      "responseIsSuccessful",
      "responseIsTooManyRequests",
      "responseIsUnauthorized",
      "responseIsUnprocessableEntity",
      "statusCodeIs",
      "statusCodeIs2xx",
      "statusCodeIs3xx",
      "statusCodeIs4xx",
      "statusCodeIs5xx",
      "statusCodeIsInRange",
      "statusCodeIsOneOf",
    ];

    for (const exportName of assertionExportNames) {
      assert.equal(typeof lighty[exportName], "function");
      assert.equal(lighty.lightyAssert[exportName], lighty[exportName]);
    }

    assert.deepEqual(
      Object.keys(lighty.lightyAssert).sort(),
      assertionExportNames.sort(),
    );

    lighty.lightyAssert.responseIsOk(makeResult(200));
    lighty.lightyAssert.statusCodeIs(makeResult(204), 204);
    lighty.lightyAssert.bodyEquals({ id: 1 }, { id: 1 });
  });
});
