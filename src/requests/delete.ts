import {parseResponse} from "../utils/parser.js";
import {HttpMethod} from "../types.js";
import {logRequestEnd, logRequestStart} from "../utils/logger.js";


export async function dlt(rawUrl: string) {
  const method: HttpMethod = "DELETE";
  const url = new URL(rawUrl);

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

