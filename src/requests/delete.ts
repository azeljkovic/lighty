import {parseResponse} from "../parser.js";
import {HttpMethod} from "../types.js";
import {logRequestEnd, logRequestStart} from "../logger.js";

type JsonBody = unknown;

export async function dlt(u: string, body: JsonBody) {
  const method: HttpMethod = "DELETE";
  const url = new URL(u);

  logRequestStart(method, url);

  try {
    const getResponse = await fetch(url, {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    await parseResponse(getResponse);
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  logRequestEnd(method, url);
}

