import {parseResponse} from "../parser.js";
import {HttpMethod} from "../types.js";
import {logRequestEnd, logRequestStart} from "../logger.js";

type JsonBody = unknown;

export async function post(URL: string, body: JsonBody) {
  const method: HttpMethod = "POST";
  logRequestStart(method, URL);

  try {
    const getResponse = await fetch(URL, {
      method: 'POST',
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

  logRequestEnd(method, URL);
}

