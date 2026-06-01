import { describe, it } from "node:test";
import { lightyAssert } from "../../dist/index.js";
import { makeResult } from "../helpers/responses.js";

describe("namespace export", () => {
  it("exposes helpers through lighty", () => {
    lightyAssert.responseIsOk(makeResult(200));
    lightyAssert.statusCodeIs(makeResult(204), 204);
    lightyAssert.bodyEquals({ id: 1 }, { id: 1 });
  });
});
