import {Body, BodyParseError, HttpMethod} from "../types.js";
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

export function logResponse(response: Response, body: Body, bodyParseError: BodyParseError) {
  if (process.env.VERBOSE_LOGGING) {
    if (response.ok) {
      console.log(`⚡️Response ok: ✅ - status code ${response.status}`);
    } else {
      console.log(`⚡️Response ok: ❌ - status code ${response.status}`);
    }
    // console.log(`⚡️Status code: ${response.status}`);
    console.log(`⚡️Status text: ${response.statusText}`);
    console.log(`⚡️URL: ${response.url}`);
    console.log(`⚡️Redirected: ${response.redirected}`);
    console.log(`⚡️Type: ${response.type}`);
    console.log('⚡️Headers:', Object.fromEntries(response.headers.entries()));
    if (body) {
      console.log('⚡️Body:', body);
    }
    if (bodyParseError) {
      console.log('⛔️️Body parse error:', bodyParseError);
    }
  }
}