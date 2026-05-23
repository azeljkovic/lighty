import {parseResponse} from "../parser.js";
import {HttpMethod} from "../types.js";
import {logRequestEnd, logRequestStart} from "../logger.js";

export async function head(u: string) {
  const method: HttpMethod = "HEAD";
  const url = new URL(u);

  logRequestStart(method, url);

  try {
    const getResponse = await fetch(url, {
      method,
    });
    await parseResponse(getResponse);
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  logRequestEnd(method, url);
}


