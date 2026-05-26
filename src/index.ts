export {
  deleteRequest,
  getRequest,
  headRequest,
  optionsRequest,
  patchRequest,
  postRequest,
  putRequest,
  request,
} from "./requests/rq.js";

export type {MethodConfig, RequestConfig} from "./requests/rq.js";
export type {Body, BodyParseError, HttpMethod} from "./types.js";
