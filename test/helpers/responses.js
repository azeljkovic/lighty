export function makeResult(status, body, headers = {}) {
  const response = makeResponse(status, headers);

  return {
    status,
    ok: response.ok,
    headers,
    data: body,
    response,
  };
}

export function makeResponse(status, headers = {}) {
  return new Response(null, { status, headers });
}

export function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
  });
}

export function textResponse(body, init = {}) {
  return new Response(body, init);
}
