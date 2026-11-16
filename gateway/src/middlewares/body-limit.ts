import type { Middleware } from "./middleware-type.ts";
import { Response } from "../response/response.ts";

export function bodyLimiter(maxBytes = 2 * 1024 * 1024): Middleware {
    return (req, res, context) => {
        const contentLengthHeader = req.headers["content-length"];
        if (!contentLengthHeader) {
            return null;
        }

        const contentLength = Number.parseInt(contentLengthHeader, 10);
        if (Number.isNaN(contentLength) || contentLength <= maxBytes) {
            return null;
        }

        const maxMb = Math.round(maxBytes / (1024 * 1024));
        const response = Response.PayloadTooLarge(
            `O tamanho da requisição excede o limite permitido de ${maxMb}MB.`,
            context.requestId
        );

        res.setHeader("x-request-id", context.requestId);
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response.toPayload()));

        return response;
    };
}
