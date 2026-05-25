import {parseResponse} from "../utils/parser.js";
import {HttpMethod, QueryValue} from "../types.js";
import {logRequestEnd, logRequestStart} from "../utils/logger.js";
import {buildUrl} from "../utils/queryParamsHandler.js";

export async function getRequest(rawUrl: string, query?: Record<string, QueryValue>) {
  const method: HttpMethod = "GET";
  const url = new URL(rawUrl);
  if (query) {
    buildUrl(url, query);
  }

  logRequestStart(method, url);

  try {
    const getResponse = await fetch(url, {
      method,
      headers: {
        'Accept': 'application/json',
      },
    });
    await parseResponse(getResponse);
    return getResponse;
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  logRequestEnd(method, url);
}


