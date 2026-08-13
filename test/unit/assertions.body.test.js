import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lightyAssert } from "../../dist/index.js";
import { makeResult } from "../helpers/responses.js";

describe("body assertions", () => {
  it("passes for matching object bodies", () => {
    const result = makeResult(200, {
      id: 1,
      name: "Ada",
      active: true,
      roles: ["admin"],
      profile: {
        email: "ada@example.test",
        settings: {
          theme: "dark",
        },
      },
      accounts: [{ id: "primary", active: true }],
    });

    lightyAssert.bodyEquals(result, {
      id: 1,
      name: "Ada",
      active: true,
      roles: ["admin"],
      profile: {
        email: "ada@example.test",
        settings: {
          theme: "dark",
        },
      },
      accounts: [{ id: "primary", active: true }],
    });
    lightyAssert.bodyContains(result, {
      profile: {
        settings: {
          theme: "dark",
        },
      },
    });
    lightyAssert.bodyHasProperty(result, "id");
    lightyAssert.bodyHasProperty(result, "name", "Ada");
    lightyAssert.bodyIncludesProperties(result, { id: 1, active: true });
    lightyAssert.bodyPathEquals(result, "profile.email", "ada@example.test");
    lightyAssert.bodyPathEquals(result, "$.accounts[0].id", "primary");
    lightyAssert.bodyPathEquals(
      result,
      "$['profile']['settings']['theme']",
      "dark",
    );
    lightyAssert.bodyMatches(result, (body) => body.roles.includes("admin"));
  });

  it("passes for array bodies", () => {
    const result = makeResult(200, [{ id: 1 }, { id: 2 }]);

    lightyAssert.bodyIsArray(result);
    lightyAssert.bodyArrayLengthIs(result, 2);
    lightyAssert.bodyArrayContains(result, { id: 1 });
    lightyAssert.bodyArrayContainsItemMatching(result, (item) => item.id === 2);
    lightyAssert.bodyArrayIsNotEmpty(result);
    lightyAssert.bodyArrayIsEmpty(makeResult(200, []));
    lightyAssert.bodyHasLength(result, 2);
    lightyAssert.bodyLengthIsGreaterThan(result, 1);
    lightyAssert.bodyLengthIsAtLeast(result, 2);
  });

  it("passes for empty bodies", () => {
    lightyAssert.bodyIsNoContent(makeResult(204, undefined));
    lightyAssert.bodyIsNoContent(makeResult(200, null));
    lightyAssert.bodyIsNoContent(makeResult(200, ""));
    lightyAssert.bodyObjectIsEmpty(makeResult(200, {}));
  });

  it("passes for text bodies containing the expected text", () => {
    lightyAssert.bodyTextContains(
      makeResult(200, "You shouldn't be here."),
      "shouldn't be here",
    );
    lightyAssert.bodyTextContains("hello world", "world");
  });

  it("passes for text bodies matching the whole expected text", () => {
    lightyAssert.bodyTextMatches(makeResult(200, "hello world"), "hello world");
    lightyAssert.bodyTextMatches("request accepted", "request accepted");
  });

  it("passes for image bodies with matching content types", () => {
    lightyAssert.bodyIsPng(
      makeResult(200, bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), {
        "content-type": "image/png",
      }),
    );
    lightyAssert.bodyIsJpeg(
      makeResult(200, bytes([0xff, 0xd8, 0xff, 0x00, 0xff, 0xd9]), {
        "content-type": "image/jpeg",
      }),
    );
    lightyAssert.bodyIsWebp(
      makeResult(
        200,
        bytes([
          0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42,
          0x50,
        ]),
        { "content-type": "image/webp" },
      ),
    );
    lightyAssert.bodyIsSvg(
      makeResult(200, "<svg><path /></svg>", {
        "content-type": "image/svg+xml; charset=utf-8",
      }),
    );
  });

  it("passes when given raw bodies", () => {
    lightyAssert.bodyEquals({ id: 1 }, { id: 1 });
    lightyAssert.bodyHasProperty({ id: 1 }, "id", 1);
    lightyAssert.bodyIsArray([1, 2, 3]);
    lightyAssert.bodyArrayLengthIs([1, 2, 3], 3);
    lightyAssert.bodyArrayContains([1, 2, 3], 2);
    lightyAssert.bodyArrayContainsItemMatching([1, 2, 3], (item) => item > 2);
    lightyAssert.bodyArrayIsNotEmpty([1]);
    lightyAssert.bodyArrayIsEmpty([]);
    lightyAssert.bodyHasLength("abc", 3);
    lightyAssert.bodyLengthIsGreaterThan("abc", 2);
    lightyAssert.bodyLengthIsAtLeast("abc", 3);
    lightyAssert.bodyObjectIsEmpty({});
    lightyAssert.bodyIsNoContent("");
    lightyAssert.bodyMatches({ enabled: true }, (body) => body.enabled);
  });

  it("throws for mismatched object bodies", () => {
    const result = makeResult(200, { id: 1, name: "Ada" });

    assert.throws(
      () => lightyAssert.bodyEquals(result, { id: 2, name: "Ada" }),
      /did not match the expected body/,
    );
    assert.throws(
      () => lightyAssert.bodyContains(result, { profile: { email: "grace" } }),
      /did not contain the expected partial body/,
    );
    assert.throws(
      () => lightyAssert.bodyHasProperty(result, "email"),
      /Expected response body to include property "email"; available properties: 'id', 'name'; received \{ id: 1, name: 'Ada' \}/,
    );
    assert.throws(
      () => lightyAssert.bodyHasProperty(result, "name", "Grace"),
      /property "name" did not match the expected value; expected 'Grace', received 'Ada'/,
    );
    assert.throws(
      () => lightyAssert.bodyIncludesProperties(result, { id: 2 }),
      /property "id" did not match the expected value; expected 2, received 1/,
    );
    assert.throws(
      () => lightyAssert.bodyPathEquals(result, "name", "Grace"),
      /path "name" did not match the expected value; expected 'Grace', received 'Ada'/,
    );
    assert.throws(
      () => lightyAssert.bodyMatches(result, (body) => body.id === 2),
      /did not match the expected condition; received \{ id: 1, name: 'Ada' \}/,
    );
  });

  it("requires partial body properties to be own properties", () => {
    assert.throws(
      () => lightyAssert.bodyContains({}, { missing: undefined }),
      /did not contain the expected partial body/,
    );

    assert.throws(
      () => lightyAssert.bodyContains(Object.create({ id: 1 }), { id: 1 }),
      /did not contain the expected partial body/,
    );
  });

  it("partially matches arrays and deeply compares non-plain objects", () => {
    lightyAssert.bodyContains([{ id: 1 }, { id: 2 }], [{ id: 1 }]);

    assert.throws(
      () =>
        lightyAssert.bodyContains(
          new Date("2024-01-01T00:00:00.000Z"),
          new Date("2025-01-01T00:00:00.000Z"),
        ),
      /did not contain the expected partial body/,
    );
    assert.throws(
      () =>
        lightyAssert.bodyContains(new Map([["id", 1]]), new Map([["id", 2]])),
      /did not contain the expected partial body/,
    );
  });

  it("matches symbol and non-enumerable partial properties", () => {
    const key = Symbol("internal");
    const actual = { [key]: { enabled: true } };
    const expected = { [key]: { enabled: true } };
    Object.defineProperty(actual, "hidden", { value: "present" });
    Object.defineProperty(expected, "hidden", { value: "present" });

    lightyAssert.bodyContains(actual, expected);
  });

  it("wraps body predicate exceptions with context", () => {
    const result = makeResult(200, { id: 1, name: "Ada" });

    assert.throws(
      () => lightyAssert.bodyMatches(result, (body) => body.profile.email),
      (error) => {
        assert.equal(error.name, "AssertionError");
        assert.match(
          error.message,
          /Response body predicate threw while evaluating received body \{ id: 1, name: 'Ada' \}: TypeError:/,
        );
        assert.equal(error.cause.name, "TypeError");
        return true;
      },
    );

    assert.throws(
      () =>
        lightyAssert.bodyArrayContainsItemMatching(
          makeResult(200, [{ id: 1 }]),
          (item) => item.profile.email,
        ),
      (error) => {
        assert.equal(error.name, "AssertionError");
        assert.match(
          error.message,
          /Response body array predicate threw at index 0 while evaluating received item \{ id: 1 \}: TypeError:/,
        );
        assert.equal(error.cause.name, "TypeError");
        return true;
      },
    );
  });

  it("rejects asynchronous body predicates", () => {
    assert.throws(
      () => lightyAssert.bodyMatches({ id: 1 }, async () => false),
      /Response body predicate must be synchronous; received a thenable/,
    );
    assert.throws(
      () =>
        lightyAssert.bodyArrayContainsItemMatching(
          [{ id: 1 }],
          async () => false,
        ),
      /Response body array predicate must be synchronous; received a thenable at index 0/,
    );
  });

  it("throws assertion failures for non-object property assertion bodies", () => {
    assert.throws(
      () => lightyAssert.bodyHasProperty(makeResult(200, null), "id"),
      {
        name: "AssertionError",
        message: /Expected response body to be a non-null object/,
      },
    );
    assert.throws(
      () =>
        lightyAssert.bodyIncludesProperties(makeResult(200, null), { id: 1 }),
      {
        name: "AssertionError",
        message: /Expected response body to be a non-null object/,
      },
    );
  });

  it("throws for mismatched array and empty body expectations", () => {
    assert.throws(
      () => lightyAssert.bodyIsArray(makeResult(200, { id: 1 })),
      /Expected response body to be an array/,
    );
    assert.throws(
      () => lightyAssert.bodyArrayLengthIs(makeResult(200, [1, 2]), 1),
      /array length did not match 1/,
    );
    assert.throws(
      () => lightyAssert.bodyArrayLengthIs(makeResult(200, "abc"), 3),
      /Expected response body to be an array/,
    );
    assert.throws(
      () =>
        lightyAssert.bodyArrayContains(makeResult(200, [{ id: 1 }]), {
          id: 2,
        }),
      /Expected response body array to contain \{ id: 2 \}; received \[ \{ id: 1 \} \]/,
    );
    assert.throws(
      () =>
        lightyAssert.bodyArrayContainsItemMatching(
          makeResult(200, [{ id: 1 }]),
          (item) => item.id === 2,
        ),
      /Expected response body array to contain an item matching the expected condition/,
    );
    assert.throws(
      () => lightyAssert.bodyArrayIsNotEmpty(makeResult(200, [])),
      /contain at least one item/,
    );
    assert.throws(
      () => lightyAssert.bodyArrayIsNotEmpty("abc"),
      /Expected response body to be an array/,
    );
    assert.throws(
      () => lightyAssert.bodyArrayIsEmpty(makeResult(200, [1])),
      /Expected response body array to be empty/,
    );
    assert.throws(
      () => lightyAssert.bodyHasLength(makeResult(200, [1, 2]), 1),
      /Response body length did not match 1/,
    );
    assert.throws(
      () => lightyAssert.bodyLengthIsGreaterThan(makeResult(200, [1]), 1),
      /Expected response body length to be greater than 1/,
    );
    assert.throws(
      () => lightyAssert.bodyLengthIsAtLeast(makeResult(200, [1]), 2),
      /Expected response body length to be at least 2/,
    );
    assert.throws(
      () => lightyAssert.bodyHasLength(makeResult(200, { id: 1 }), 1),
      /Expected response body to have a numeric length property/,
    );
    assert.throws(
      () => lightyAssert.bodyObjectIsEmpty(makeResult(200, [])),
      /Expected response body to be a non-array object/,
    );
    assert.throws(
      () => lightyAssert.bodyObjectIsEmpty(makeResult(200, { id: 1 })),
      /Expected response body object to be empty/,
    );
    assert.throws(
      () => lightyAssert.bodyIsNoContent(makeResult(200, [])),
      /Expected response body to have no content/,
    );
  });

  it("throws for mismatched or non-text body text expectations", () => {
    assert.throws(
      () =>
        lightyAssert.bodyTextContains(makeResult(200, "hello world"), "bye"),
      /Expected response body text to contain 'bye'; received 'hello world'/,
    );
    assert.throws(
      () =>
        lightyAssert.bodyTextContains(
          makeResult(200, { text: "hello" }),
          "hello",
        ),
      /Expected response body to be text; received \{ text: 'hello' \}/,
    );
    assert.throws(
      () =>
        lightyAssert.bodyTextMatches(makeResult(200, "hello world"), "hello"),
      /Response body text did not match the expected text; expected 'hello', received 'hello world'/,
    );
    assert.throws(
      () =>
        lightyAssert.bodyTextMatches(
          makeResult(200, { text: "hello" }),
          "hello",
        ),
      /Expected response body to be text; received \{ text: 'hello' \}/,
    );
  });

  it("throws for mismatched image content types and bodies", () => {
    assert.throws(
      () =>
        lightyAssert.bodyIsPng(
          makeResult(200, bytes([0x89, 0x50, 0x4e, 0x47]), {
            "content-type": "image/jpeg",
          }),
        ),
      /Expected response content-type to be 'image\/png'; received 'image\/jpeg'/,
    );
    assert.throws(
      () =>
        lightyAssert.bodyIsPng(
          makeResult(200, bytes([0x00, 0x50, 0x4e, 0x47]), {
            "content-type": "image/png",
          }),
        ),
      /Expected response body to be a PNG image/,
    );
    assert.throws(
      () =>
        lightyAssert.bodyIsJpeg(
          makeResult(200, bytes([0xff, 0xd8, 0xff, 0x00, 0x00]), {
            "content-type": "image/jpeg",
          }),
        ),
      /Expected response body to be a JPEG image/,
    );
    assert.throws(
      () =>
        lightyAssert.bodyIsWebp(
          makeResult(
            200,
            bytes([
              0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x4a, 0x50,
              0x45, 0x47,
            ]),
            { "content-type": "image/webp" },
          ),
        ),
      /Expected response body to be a WEBP image/,
    );
    assert.throws(
      () =>
        lightyAssert.bodyIsSvg(
          makeResult(200, "<html></html>", {
            "content-type": "image/svg+xml",
          }),
        ),
      /Expected response body to be an SVG image/,
    );
    assert.throws(
      () =>
        lightyAssert.bodyIsPng(
          makeResult(200, "not binary", {
            "content-type": "image/png",
          }),
        ),
      /Expected response body to be an ArrayBuffer/,
    );
  });
});

function bytes(values) {
  return Uint8Array.from(values).buffer;
}
