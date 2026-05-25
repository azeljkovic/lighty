import {QueryValue} from "../types.js";

export function buildUrl(
  url: URL,
  params: Record<string, QueryValue>
): URL {

  // const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach(v => url.searchParams.append(key, v));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}