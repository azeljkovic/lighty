import assert from "node:assert/strict";

export async function assertRejectsWithError(promise, ErrorClass, assertions) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof ErrorClass);
    assertions(error);

    return true;
  });
}
