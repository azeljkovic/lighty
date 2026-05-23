import {parseResponse} from "../parser.js";
import {HttpMethod} from "../types.js";

type JsonBody = unknown;

export async function post(URL: string, body: JsonBody) {
  const method: HttpMethod = "POST";
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
}

