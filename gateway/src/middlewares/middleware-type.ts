import type { IncomingMessage, ServerResponse } from "node:http";
import type { RequestContext } from "../interfaces/request-context-interface.ts";
import type { Response } from "../response/response.ts";

export type Middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    context: RequestContext
) => Promise<Response | null> | Response | null;
