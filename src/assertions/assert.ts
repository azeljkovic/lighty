import * as assert from "node:assert";


export function responseIsOk(response: Response) {
  assert.ok(response.status >= 200 && response.status <= 299, `Response not ok (outside of range 200-299)`);
}

export function statusCodeIs(response: Response, statusCode: number) {
  assert.equal(response.status, statusCode, `Response status code ${response.status} does not match the expected status code ${statusCode}`);
}