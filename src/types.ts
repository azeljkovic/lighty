export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
export type Body = unknown;
export type BodyParseError = string | undefined;
export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | string[];