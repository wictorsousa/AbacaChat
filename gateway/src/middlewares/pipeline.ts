import type { IncomingMessage, ServerResponse } from "node:http";
import type { RequestContext } from "../interfaces/request-context-interface.ts";
import type { Response } from "../response/response.ts";
import type { Middleware } from "./middleware-type.ts";

export async function runMiddlewares(
    middlewares: Middleware[],
    req: IncomingMessage,
    res: ServerResponse,
    context: RequestContext
): Promise<Response | null> {
    for (const middleware of middlewares) {
        const blockedResponse = await middleware(req, res, context);
        if (blockedResponse) {
            return blockedResponse;
        }
    }
    return null;
}
