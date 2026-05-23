import {parseResponse} from "../parser.js";
import {HttpMethod} from "../types.js";
import {logRequestEnd, logRequestStart} from "../logger.js";

export async function head(URL: string) {
  const method: HttpMethod = "HEAD";
  logRequestStart(method, URL);

  try {
    const getResponse = await fetch(URL, {
      method,
    });
    await parseResponse(getResponse);
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  logRequestEnd(method, URL);
}


