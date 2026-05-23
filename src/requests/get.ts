import {parseResponse} from "../parser.js";
import {HttpMethod} from "../types.js";
import {logRequestEnd, logRequestStart} from "../logger.js";

export async function get(u: string) {
  const method: HttpMethod = "GET";
  const url = new URL(u);

  logRequestStart(method, url);

  try {
    const getResponse = await fetch(url, {
      method,
      headers: {
        'Accept': 'application/json',
      },
    });
    await parseResponse(getResponse);
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  logRequestEnd(method, url);
}


