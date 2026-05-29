export interface HttpRequestErrorOptions<TBody = unknown> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: TBody;
  url: string;
}

export interface InvalidJsonResponseErrorOptions {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  url: string;
  cause: unknown;
}

export class HttpRequestError<TBody = unknown> extends Error {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: TBody;
  url: string;

  constructor(options: HttpRequestErrorOptions<TBody>) {
    super(`Request failed with status ${options.status}`);
    this.name = "HttpRequestError";
    this.status = options.status;
    this.statusText = options.statusText;
    this.headers = options.headers;
    this.body = options.body;
    this.url = options.url;
  }
}

export class InvalidJsonResponseError extends Error {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  url: string;

  constructor(options: InvalidJsonResponseErrorOptions) {
    super(
      `Failed to parse JSON response from ${options.url} (status ${options.status})`,
      { cause: options.cause },
    );
    this.name = "InvalidJsonResponseError";
    this.status = options.status;
    this.statusText = options.statusText;
    this.headers = options.headers;
    this.body = options.body;
    this.url = options.url;
  }
}
