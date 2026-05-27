import type { RequestResult } from "../requests/rq.js";

export type ResponseAssertionTarget = Response | RequestResult<unknown>;
export type BodyAssertionTarget<TBody = unknown> = TBody | RequestResult<TBody>;

export function getResponse(response: ResponseAssertionTarget): Response {
  return "response" in response ? response.response : response;
}

export function getBody<TBody>(body: BodyAssertionTarget<TBody>): TBody {
  return isRequestResult(body) ? body.data : body;
}

function isRequestResult<TBody>(
  value: BodyAssertionTarget<TBody>,
): value is RequestResult<TBody> {
  return (
    typeof value === "object" &&
    value !== null &&
    "response" in value &&
    "data" in value
  );
}
