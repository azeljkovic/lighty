import {before, describe, it} from 'node:test';
import {getRequest} from "./dist/requests/get.js";
import {responseIsOk} from "./dist/assertions/assert.js";
import {statusCodeIs} from "./src/assertions/assert.ts";

const url = 'https://restful-booker.herokuapp.com/booking';

describe('GET request', () => {
  let response;

  before(async () => {
    response = await getRequest(url);
  });

  it('returns ok status code', () => {
    // assert.ok(r, 'Expected getRequest to return a Response');
    responseIsOk(response);

    // assert.strictEqual(r.status, 200);
  });

  it('returns status code 200', () => {
    statusCodeIs(response, 201);
  });
});
