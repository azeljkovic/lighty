import { createClient } from "../dist/index.js";

export const client = createClient({
  baseUrl: "http://localhost",
  timeoutMs: 5_000,
  throwOnHttpError: false,
  responseType: "json",
  logger: "basic",
});
