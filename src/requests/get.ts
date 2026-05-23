import {parseResponse} from "../parser.js";
import {HttpMethod} from "../types.js";
import {logRequestEnd, logRequestStart} from "../logger.js";

export async function get(URL: string) {
  const method: HttpMethod = "GET";
  logRequestStart(method, URL);

  try {
    const getResponse = await fetch(URL, {
      method,
      headers: {
        'Accept': 'application/json',
      },
    });
    await parseResponse(getResponse);
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  logRequestEnd(method, URL);
}


