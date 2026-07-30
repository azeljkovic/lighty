# ⚡ lighty

`lighty` is a small ESM HTTP testing library for Node.js. It wraps `fetch` with typed request helpers and pairs the response with assertion helpers for status codes, headers, JSON/text bodies, redirects, and common image payloads.

The library is designed for integration tests written with `node:test`, but the request and assertion helpers can be used from any JavaScript or TypeScript test runner.

## Requirements

- Node.js 24 or newer
- An ESM project, or files that can use `import`

## Installation

```sh
pnpm add @azeljkovic/lighty
```

Use your package manager's equivalent command if you are not using pnpm.

## Quick Start

```js
import { describe, it } from "node:test";
import { createClient, lightyAssert } from "@azeljkovic/lighty";

const client = createClient({
  baseUrl: "https://api.example.test",
  timeoutMs: 5_000,
});

describe("users API", () => {
  it("creates a user", async () => {
    const result = await client.postRequest("/users", {
      params: {
        source: "test",
      },
      body: {
        name: "Ada Lovelace",
        active: true,
      },
    });

    lightyAssert.statusCodeIs(result, 201);
    lightyAssert.headerIncludes(result, "content-type", "application/json");
    lightyAssert.bodyContains(result, {
      name: "Ada Lovelace",
      active: true,
    });
  });
});
```

The request result has this shape:

```ts
interface RequestResult<TResponse = unknown> {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  data: TResponse;
  response: Response;
}
```

Most assertion helpers accept either the full `RequestResult` or the raw value they assert against. For example, response and header assertions can use a `RequestResult` or a `Response`; body assertions can use a `RequestResult` or the parsed body directly.

## Exports

```js
import {
  createClient,
  customRequest,
  getRequest,
  postRequest,
  putRequest,
  patchRequest,
  deleteRequest,
  headRequest,
  optionsRequest,
  lightyRequest,
  lightyAssert,
  HttpRequestError,
  InvalidJsonResponseError,
} from "@azeljkovic/lighty";
```

Request helpers are exported directly and under `lightyRequest`. Assertion helpers are exported directly and under `lightyAssert`.

## Requests

### `createClient(config)`

Creates a client with shared defaults:

```js
import { createClient } from "@azeljkovic/lighty";

const client = createClient({
  baseUrl: "https://api.example.test/v1",
  headers: {
    Authorization: "Bearer test-token",
  },
  timeoutMs: 5_000,
  responseType: "json",
  redirect: "follow",
  logger: "basic",
});

const result = await client.getRequest("/users", {
  params: {
    active: true,
  },
});
```

Client methods:

- `client.customRequest(config)`
- `client.getRequest(url, config?)`
- `client.postRequest(url, config?)`
- `client.putRequest(url, config?)`
- `client.patchRequest(url, config?)`
- `client.deleteRequest(url, config?)`
- `client.headRequest(url, config?)`
- `client.optionsRequest(url, config?)`

Per-request options override client defaults. Headers are merged case-insensitively, and request-level headers win over client-level headers.

### Direct Request Helpers

Use direct helpers when you do not need shared defaults:

```js
import { customRequest, getRequest, postRequest } from "@azeljkovic/lighty";

const getResult = await getRequest("https://api.example.test/users", {
  params: {
    active: true,
  },
});

const postResult = await postRequest("https://api.example.test/users", {
  body: {
    name: "Grace Hopper",
  },
});

const customResult = await customRequest({
  method: "PATCH",
  url: "https://api.example.test/users/1",
  body: {
    active: false,
  },
});
```

### Request Configuration

```ts
interface RequestConfig<TBody = unknown> {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
  url: string;
  headers?: HeadersInit;
  params?: Record<
    string,
    | string
    | number
    | boolean
    | null
    | undefined
    | Array<string | number | boolean>
  >;
  body?: TBody;
  signal?: AbortSignal;
  timeoutMs?: number;
  throwOnHttpError?: boolean;
  responseType?: "json" | "text" | "arrayBuffer" | "blob" | "stream" | "none";
  redirect?: "error" | "follow" | "manual";
  logger?: "off" | "basic" | "verbose" | false | RequestLogger;
}
```

For method-specific helpers, `method` and `url` are supplied by the helper. `GET`, `DELETE`, `HEAD`, and `OPTIONS` configs do not accept `body`.

### Query Parameters

`params` are appended to the URL:

```js
await client.getRequest("/anything", {
  params: {
    color: "ultraviolet",
    page: 2,
    tags: ["api", "test"],
    includeDrafts: false,
    ignored: undefined,
  },
});
```

`null` and `undefined` values are skipped. Array values are appended as repeated query parameters.

### Request Bodies

When `body` is provided, lighty JSON-stringifies it and sets `Content-Type: application/json` unless you override that header.
Every request also sends `Accept: application/json` unless you override it.

```js
await client.postRequest("/anything", {
  body: {
    color: "green",
    transparent: false,
  },
});
```

### Response Parsing

By default, lighty parses responses based on the `content-type` header:

- `application/json` is parsed as JSON.
- `application/octet-stream` is parsed as an `ArrayBuffer`.
- Empty responses return `undefined`.
- Other payloads are returned as text.

You can force a parser with `responseType`:

```js
const textResult = await client.getRequest("/robots.txt", {
  responseType: "text",
});

const imageResult = await client.getRequest("/image/png", {
  responseType: "arrayBuffer",
});

const streamResult = await client.getRequest("/events", {
  responseType: "stream",
});
```

Supported response types are:

- `json`
- `text`
- `arrayBuffer`
- `blob`
- `stream`
- `none`

### HTTP Errors

By default, non-2xx responses are returned as normal `RequestResult` values, so tests can assert their status and body:

```js
const result = await client.getRequest("/missing");

lightyAssert.statusCodeIs(result, 404);
lightyAssert.bodyContains(result, {
  code: "not_found",
});
```

Set `throwOnHttpError: true` when non-2xx responses should throw `HttpRequestError` after the response body has been parsed:

```js
import { HttpRequestError, patchRequest } from "@azeljkovic/lighty";

try {
  await patchRequest("https://api.example.test/users/1", {
    body: {
      email: "",
    },
    throwOnHttpError: true,
  });
} catch (error) {
  if (error instanceof HttpRequestError) {
    console.log(error.status);
    console.log(error.statusText);
    console.log(error.headers);
    console.log(error.body);
    console.log(error.url);
  }
}
```

Invalid JSON responses throw `InvalidJsonResponseError` with status, headers, raw body text, URL, and the original parsing error as `cause`.

### Timeouts and Abort Signals

Use `timeoutMs` for request timeouts:

```js
await client.getRequest("/slow", {
  timeoutMs: 1_000,
});
```

You can also pass an `AbortSignal`. If both `signal` and `timeoutMs` are provided, the request aborts when either one aborts.

### Redirects

`redirect` is passed to `fetch` and supports `follow`, `manual`, and `error`:

```js
const result = await client.getRequest("/redirect-to", {
  redirect: "manual",
  responseType: "text",
  params: {
    url: "/get",
    status_code: 302,
  },
});

lightyAssert.responseRedirectsTo(result, "/get");
```

## Assertions

All assertion helpers use Node's `node:assert` module and throw `AssertionError` with detailed failure messages.

### Status and Response Assertions

```js
lightyAssert.responseIsOk(result);
lightyAssert.responseIsSuccessful(result);
lightyAssert.responseIsCreated(result);
lightyAssert.responseIsAccepted(result);
lightyAssert.responseIsNoContent(result);
lightyAssert.responseIsRedirect(result);
lightyAssert.responseRedirectsTo(result, "/login");
lightyAssert.responseWasRedirectedTo(result, "/dashboard");
lightyAssert.responseIsClientError(result);
lightyAssert.responseIsBadRequest(result);
lightyAssert.responseIsUnauthorized(result);
lightyAssert.responseIsForbidden(result);
lightyAssert.responseIsNotFound(result);
lightyAssert.responseIsConflict(result);
lightyAssert.responseIsUnprocessableEntity(result);
lightyAssert.responseIsTooManyRequests(result);
lightyAssert.responseIsServerError(result);
lightyAssert.statusCodeIs(result, 200);
lightyAssert.statusCodeIsOneOf(result, [200, 201, 204]);
lightyAssert.statusCodeIsInRange(result, 200, 299);
lightyAssert.statusCodeIs2xx(result);
lightyAssert.statusCodeIs3xx(result);
lightyAssert.statusCodeIs4xx(result);
lightyAssert.statusCodeIs5xx(result);
```

### Header Assertions

```js
lightyAssert.headerExists(result, "server");
lightyAssert.headerIs(result, "content-type", "application/json");
lightyAssert.headerIncludes(result, "content-type", "application/json");
lightyAssert.headerMatches(result, "x-request-id", /^request-\d+$/);
lightyAssert.headerSatisfies(result, "cache-control", (value) =>
  value.includes("max-age"),
);
lightyAssert.headerContentTypeIs(result, "application/json");
```

### Body Assertions

Object and partial matching:

```js
lightyAssert.bodyEquals(result, {
  id: 1,
  name: "Ada",
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
lightyAssert.bodyIncludesProperties(result, {
  id: 1,
  active: true,
});
lightyAssert.bodyPathEquals(result, "$.accounts[0].id", "primary");
lightyAssert.bodyMatches(result, (body) => body.roles.includes("admin"));
```

Text matching:

```js
lightyAssert.bodyTextContains(result, "Unicode Demo");
lightyAssert.bodyTextMatches(result, "User-agent: *\nDisallow: /deny\n");
```

Array matching:

```js
lightyAssert.bodyIsArray(result);
lightyAssert.bodyArrayLengthIs(result, 2);
lightyAssert.bodyArrayContains(result, {
  id: 1,
});
lightyAssert.bodyArrayContainsItemMatching(result, (item) => item.id === 2);
lightyAssert.bodyArrayIsNotEmpty(result);
lightyAssert.bodyArrayIsEmpty([]);
```

Length and empty-body helpers:

```js
lightyAssert.bodyHasLength(result, 3);
lightyAssert.bodyLengthIsGreaterThan(result, 2);
lightyAssert.bodyLengthIsAtLeast(result, 3);
lightyAssert.bodyObjectIsEmpty(result);
lightyAssert.bodyIsNoContent(result);
```

Image helpers:

```js
const pngResult = await client.getRequest("/image/png", {
  responseType: "arrayBuffer",
});

lightyAssert.bodyIsPng(pngResult);
lightyAssert.bodyIsJpeg(jpegResult);
lightyAssert.bodyIsWebp(webpResult);
lightyAssert.bodyIsSvg(svgResult);
```

## Logging

Requests do not log by default. Set `logger` to `"basic"` or `"verbose"` to enable the built-in console logger.

```js
await client.getRequest("/users", {
  logger: "basic",
});
```

Built-in logger levels:

- `basic`: logs request start and request completion.
- `verbose`: logs request start, response details, and request completion.
- `off`: disables logs.

You can provide custom hooks:

```js
const events = [];

await client.postRequest("/users", {
  body: {
    username: "ada",
    password: "secret",
  },
  logger: {
    level: "verbose",
    requestStart: (entry) => events.push(["requestStart", entry]),
    response: (entry) => events.push(["response", entry]),
    requestEnd: (entry) => events.push(["requestEnd", entry]),
  },
});
```

Logger entries redact sensitive header names, query parameters, and body keys containing words such as `authorization`, `cookie`, `password`, `secret`, `session`, `token`, and `apiKey`.

## Example: Asserting Request Data

This is a common pattern for asserting a response that echoes request params and a JSON body:

```js
import { describe, it } from "node:test";
import { createClient, lightyAssert } from "@azeljkovic/lighty";

const client = createClient({
  baseUrl: "https://api.example.test",
});

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
      params,
      body,
    });

    lightyAssert.statusCodeIs(result, 200);
    lightyAssert.headerContentTypeIs(result, "application/json");
    lightyAssert.bodyContains(result, {
      args: params,
    });
    lightyAssert.bodyContains(result, {
      json: body,
    });
  });
});
```

## Development

Install dependencies:

```sh
pnpm install
```

Build:

```sh
pnpm run build
```

Run tests:

```sh
pnpm test
pnpm run test:unit
pnpm run test:integration
pnpm run test:package
```

Format and lint:

```sh
pnpm run format
pnpm run lint
```

## Project Layout

- `src/requests`: request helpers, client factory, response parsing, and request errors
- `src/assertions`: response, header, and body assertions
- `src/utils/logger.ts`: built-in and custom request logging support
- `test`: unit, integration, and package smoke tests
