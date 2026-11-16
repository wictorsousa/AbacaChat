import http from "node:http";
import https from "node:https";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Response } from "../response/response.ts";
import type { RequestContext } from "../interfaces/request-context-interface.ts";

export function forwardRequest(
    req: IncomingMessage,
    res: ServerResponse,
    targetUrl: string,
    context: RequestContext
): Promise<Response> {
    return new Promise((resolve) => {
        const parsedUrl = new URL(targetUrl);
        const isHttps = parsedUrl.protocol === "https:";
        const client = isHttps ? https : http;

        const headers = { ...req.headers };
        headers.host = parsedUrl.host;
        headers["x-request-id"] = context.requestId;
        headers["x-forwarded-for"] = context.clientIp;
        headers["x-forwarded-proto"] = isHttps ? "https" : "http";
        headers["x-forwarded-host"] = req.headers.host || "";

        const options: http.RequestOptions = {
            protocol: parsedUrl.protocol,
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: `${parsedUrl.pathname}${parsedUrl.search}`,
            method: req.method,
            headers,
            timeout: 10000
        };

        const proxyReq = client.request(options, (proxyRes) => {
            const statusCode = proxyRes.statusCode || 500;
            const statusText = proxyRes.statusMessage || "";

            res.setHeader("x-request-id", context.requestId);
            res.writeHead(statusCode, proxyRes.headers);
            proxyRes.pipe(res);

            const chunks: Buffer[] = [];
            proxyRes.on("data", (chunk) => {
                chunks.push(Buffer.from(chunk));
            });

            proxyRes.on("end", () => {
                let parsedData: unknown = null;
                const contentType = proxyRes.headers["content-type"] || "";
                if (contentType.includes("application/json")) {
                    try {
                        const rawBody = Buffer.concat(chunks).toString("utf-8");
                        if (rawBody.trim()) {
                            parsedData = JSON.parse(rawBody);
                        }
                    } catch {
                        parsedData = null;
                    }
                }

                const responseInstance = new Response(
                    parsedData,
                    statusCode,
                    statusText || "Proxied successfully",
                    {
                        success: statusCode >= 200 && statusCode < 400,
                        requestId: context.requestId
                    }
                );
                resolve(responseInstance);
            });
        });

        proxyReq.on("timeout", () => {
            proxyReq.destroy();
            const responseInstance = Response.GatewayTimeout(
                "Tempo limite excedido ao comunicar com o microsserviço.",
                context.requestId
            );

            if (!res.headersSent) {
                res.setHeader("x-request-id", context.requestId);
                res.writeHead(responseInstance.status, { "Content-Type": "application/json" });
                res.end(JSON.stringify(responseInstance.toPayload()));
            }

            resolve(responseInstance);
        });

        proxyReq.on("error", () => {
            const responseInstance = Response.BadGateway(
                "Serviço de destino indisponível ou offline.",
                context.requestId
            );

            if (!res.headersSent) {
                res.setHeader("x-request-id", context.requestId);
                res.writeHead(responseInstance.status, { "Content-Type": "application/json" });
                res.end(JSON.stringify(responseInstance.toPayload()));
            }

            resolve(responseInstance);
        });

        req.on("error", () => {
            proxyReq.destroy();
        });

        req.pipe(proxyReq);
    });
}
