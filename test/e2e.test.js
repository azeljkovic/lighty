import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lightyAssert, lightyRequest } from "../dist/index.js";

describe("request and assertion", () => {
  it("makes a real GET request", async () => {
    const result = await lightyRequest.getRequest(
      "https://restful-booker.herokuapp.com/booking",
    );

    lightyAssert.responseIsOk(result);
    lightyAssert.statusCodeIs(result, 200);
    lightyAssert.bodyIsArray(result);
    lightyAssert.bodyArrayIsNotEmpty(result);
    assert.equal(typeof result.data[0].bookingid, "number");
  });
});
