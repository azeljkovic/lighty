import {parseResponse} from "../parser.js";
import {HttpMethod} from "../types.js";
import {logRequestEnd, logRequestStart} from "../logger.js";

export async function get(rawUrl: string) {
  const method: HttpMethod = "GET";
  const url = new URL(rawUrl);

  // url.searchParams.set('firstname', 'John');
  // url.searchParams.set('lastname', 'Smith');

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


