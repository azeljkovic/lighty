import {parseResponse} from "../parser.js";
import {HttpMethod} from "../types.js";
import {logRequestEnd, logRequestStart} from "../logger.js";

export async function options(rawUrl: string) {
  const method: HttpMethod = "OPTIONS";
  const url = new URL(rawUrl);

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


