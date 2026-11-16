import http from "node:http";
import crypto from "node:crypto";

import { config } from "./configs/config.ts";
import { logger } from "./loggers/logger.ts";
import { Response } from "./response/response.ts";
import { resolveRoute } from "./routers/router.ts";
import { forwardRequest } from "./proxy/proxy.ts";
import type { RequestContext } from "./interfaces/request-context-interface.ts";
import { getCurrentTimestamp } from "./functions/current-timestamp.ts";

import { runMiddlewares } from "./middlewares/pipeline.ts";
import { bodyLimiter } from "./middlewares/body-limit.ts";
import { rateLimiter } from "./middlewares/rate-limiter.ts";

const middlewares = [
    bodyLimiter(2 * 1024 * 1024),
    rateLimiter({ maxRequests: 60, windowMs: 60000 })
];

const server = http.createServer(async (req, res) => {
    const startedAt = performance.now();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    const requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
    const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = (req.headers["user-agent"] as string) || "unknown";
    const protocol = `HTTP/${req.httpVersion}`;
    const method = req.method ?? "UNKNOWN";
    const route = req.url ?? "/";

    const routeMatch = resolveRoute(route);

    if (!routeMatch) {
        const duration = Number((performance.now() - startedAt).toFixed(2));
        const response = Response.NotFound("Recurso não encontrado no gateway.", requestId);
        const context: RequestContext = {
            requestId,
            method,
            route,
            serviceName: "unknown",
            destination: "UNKNOWN",
            clientIp,
            userAgent,
            protocol,
            headers: req.headers,
            duration,
            timestamp: getCurrentTimestamp()
        };

        logger.request({ context, response });

        res.setHeader("x-request-id", requestId);
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response.toPayload()));
        return;
    }

    const context: RequestContext = {
        requestId,
        method,
        route,
        serviceName: routeMatch.serviceName,
        destination: routeMatch.targetUrl,
        clientIp,
        userAgent,
        protocol,
        headers: req.headers,
        duration: 0,
        timestamp: getCurrentTimestamp()
    };

    const blockedResponse = await runMiddlewares(middlewares, req, res, context);
    if (blockedResponse) {
        context.duration = Number((performance.now() - startedAt).toFixed(2));
        logger.request({ context, response: blockedResponse });
        return;
    }

    const response = await forwardRequest(req, res, routeMatch.targetUrl, context);
    context.duration = Number((performance.now() - startedAt).toFixed(2));

    logger.request({ context, response });
});

server.listen(config.GATEWAY_PORT, () => {
    logger.title("ABACACHAT GATEWAY");
    logger.info("Gateway service is running successfully");
    logger.info(`Gateway is listening on port ${config.GATEWAY_PORT}`);
});
