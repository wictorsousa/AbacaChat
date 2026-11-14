import http from "http";
import chalk from "chalk";

import { config } from "./configs/config.ts";
import { logger } from "./loggers/logger.ts";
import { Response } from "./response/response.ts";

import type { RequestContext } from "./interfaces/request-context-interface.ts";

import { getCurrentTimestamp } from "./functions/current-timestamp.ts";
import { getMockUserData } from "./functions/mock-data-user..ts";

const routes = {
    '/kernel': config.KERNEL_MODULE_URL,
    '/user': config.USER_MODULE_URL,
    '/recommendation': config.RECOMANDATION_MODULE_URL,
    '/notification': config.NOTIFICATION_MODULE_URL,
    '/authentication': config.AUTHENTICATION_MODULE_URL,
    '/user-notes': config.USER_NOTES_MODULE_URL
}

const server = http.createServer((req, res) => {
    const startedAt = performance.now();

    logger.info("A request has been received", { leadingNewline: true });

    const pathname = new URL(
        req.url || "/",
        `http://${req.headers.host}`
    ).pathname;

    const destinationUrl = routes[pathname as keyof typeof routes];

    const method = req.method ?? "UNKNOWN";
    const route = req.url ?? pathname;

    if(!destinationUrl) {
        const response = Response.NotFound(null, "Invalid request URL");
        const context: RequestContext = {
            method,
            route,
            destination: "UNKNOWN",
            duration: Number((performance.now() - startedAt).toFixed(2))
        };

        logger.request({ context, response });

        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ 
            data: response.data,
            message: response.message,
            method,
            route,
            date: response.timestamp 
        }));
        
        return;
    }

    const response = Response.Ok(
        getMockUserData(),
        "Hello there! This is the gateway service."
    );
    const context: RequestContext = {
        method,
        route,
        destination: destinationUrl,
        duration: Number((performance.now() - startedAt).toFixed(2))
    };

    logger.request({ context, response });

    res.writeHead(response.status, { 
        "Content-Type": "application/json" 
    });
    
    res.end(JSON.stringify({ 
        data: response.data,
        message: response.message,
        method,
        route,
        date: response.timestamp
    }));
});

server.listen(config.GATEWAY_PORT, () => {
    logger.title("ABACACHAT GATEWAY")
    logger.info(`Gateway service is running successfully`);
    logger.info(`Gateway is listening on port ${config.GATEWAY_PORT}`);
});
