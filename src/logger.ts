import {HttpMethod} from "./types.js";

export function logRequestStart(verb: HttpMethod, url: string){
  console.log(`\n ℹ️  ${verb} request to ${url} started!\n`);
}

export function logRequestEnd(verb: HttpMethod, url: string){
  console.log(`\n ✅ ${verb} request to ${url} completed!\n`);
}