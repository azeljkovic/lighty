import {logResponse} from "./logger.js";
import {Body, BodyParseError} from "./types.js";

export async function parseResponse(response: Response) {
  const text = await response.text();
  const contentType = response.headers.get('content-type') ?? '';
  let body: Body = text;
  let bodyParseError: BodyParseError;

  if (contentType.includes('application/json') && text) {
    try {
      body = JSON.parse(text);
    } catch (error) {
      bodyParseError = error instanceof Error ? error.message : String(error);
    }
  }

  logResponse(response, body, bodyParseError);

  return;
}
