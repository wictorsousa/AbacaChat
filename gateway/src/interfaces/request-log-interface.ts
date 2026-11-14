import type { RequestContext } from "./request-context-interface.ts";
import type { Response } from "../response/response.ts";

export interface RequestLog<T> {
    context: RequestContext;
    response: Response<T>;
}
