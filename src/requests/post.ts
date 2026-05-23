import {parseResponse} from "../parser.js";
import {HttpMethod} from "../types.js";
import {logRequestEnd, logRequestStart} from "../logger.js";

type JsonBody = unknown;

export async function post(rawUrl: string, body: JsonBody) {
  const method: HttpMethod = "POST";
  const url = new URL(rawUrl);

  logRequestStart(method, url);

  try {
    const getResponse = await fetch(url, {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    await parseResponse(getResponse);
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  logRequestEnd(method, url);
}

