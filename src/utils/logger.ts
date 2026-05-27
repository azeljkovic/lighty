import { HttpMethod } from "../types.js";
import process from "node:process";

export function logRequestStart(verb: HttpMethod, url: URL) {
  if (process.env.VERBOSE_LOGGING) {
    console.log(`\n ℹ️  ${verb} request to ${url} started!\n`);
  }
}

export function logRequestEnd(verb: HttpMethod, url: URL) {
  if (process.env.VERBOSE_LOGGING) {
    console.log(`\n 🎯 ${verb} request to ${url} completed!\n`);
  }
}

export async function logResponse(response: Response) {
  if (process.env.VERBOSE_LOGGING) {
    if (response.ok) {
      console.log(`⚡️Response ok: ✅ - status code ${response.status}`);
    } else {
      console.log(`⚡️Response ok: ❌ - status code ${response.status}`);
    }
    console.log(`⚡️Status text: ${response.statusText}`);
    console.log(`⚡️URL: ${response.url}`);
    console.log(`⚡️Redirected: ${response.redirected}`);
    console.log(`⚡️Type: ${response.type}`);
    console.log("⚡️Headers:", Object.fromEntries(response.headers.entries()));
    // console.log('⚡️Body:', JSON.stringify(response.body));
    const text = await response.clone().text();

    try {
      console.log("⚡️Body:", JSON.parse(text));
    } catch {
      console.log("⚡️Body:", text);
    }
  }
}
