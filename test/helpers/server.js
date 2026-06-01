import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createServer } from "node:http";

export async function withLocalHttpServer(handler, test) {
  const server = createServer(async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      sendJson(
        res,
        500,
        {
          error: error instanceof Error ? error.stack : String(error),
        },
        { "content-type": "application/json" },
      );
    }
  });

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    await test(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

export async function readJsonBody(req) {
  const text = await readTextBody(req);

  return JSON.parse(text);
}

export async function readTextBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

export function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, {
    "content-type": "application/json",
    ...headers,
  });
  res.end(JSON.stringify(body));
}

export function sendText(res, status, body, headers = {}) {
  res.writeHead(status, {
    "content-type": "text/plain",
    ...headers,
  });
  res.end(body);
}

export function sendEmpty(res, status, headers = {}) {
  res.writeHead(status, headers);
  res.end();
}
