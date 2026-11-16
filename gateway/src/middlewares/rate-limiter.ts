import type { Middleware } from "./middleware-type.ts";
import { Response } from "../response/response.ts";

interface RateLimiterOptions {
    maxRequests?: number;
    windowMs?: number;
}

interface ClientRecord {
    count: number;
    resetAt: number;
}

export function rateLimiter(options: RateLimiterOptions = {}): Middleware {
    const maxRequests = options.maxRequests ?? 60;
    const windowMs = options.windowMs ?? 60000;
    const clients = new Map<string, ClientRecord>();

    return (_req, res, context) => {
        const now = Date.now();
        const clientIp = context.clientIp || "unknown";

        const currentRecord = clients.get(clientIp);

        if (!currentRecord || now > currentRecord.resetAt) {
            clients.set(clientIp, {
                count: 1,
                resetAt: now + windowMs
            });
            return null;
        }

        if (currentRecord.count < maxRequests) {
            currentRecord.count += 1;
            return null;
        }

        const retryAfterSeconds = Math.max(1, Math.ceil((currentRecord.resetAt - now) / 1000));
        const response = Response.TooManyRequests(
            "Limite de requisições excedido. Aguarde antes de tentar novamente.",
            context.requestId
        );

        res.setHeader("retry-after", retryAfterSeconds.toString());
        res.setHeader("x-request-id", context.requestId);
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response.toPayload()));

        return response;
    };
}
