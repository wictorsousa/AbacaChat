import { getCurrentTimestamp } from "../functions/current-timestamp.ts";
import { STATUS_CODES } from "node:http";

export interface ResponseError {
    code: string;
    message: string;
    details?: unknown;
}

export interface ResponsePayload<T> {
    success: boolean;
    status: number;
    statusText: string;
    message: string;
    requestId?: string;
    data?: T | null;
    error?: ResponseError | null;
    timestamp: string;
}

export class Response<T = unknown> {
    success: boolean;
    status: number;
    statusText: string;
    message: string;
    data: T | null;
    error: ResponseError | null;
    requestId?: string;
    timestamp: string;

    constructor(
        data: T | null,
        status: number,
        message: string,
        options: {
            success?: boolean;
            requestId?: string;
            error?: ResponseError | null;
        } = {}
    ) {
        this.status = status;
        this.statusText = STATUS_CODES[status] ?? "Unknown Status";
        this.success = options.success ?? (status >= 200 && status < 400);
        this.message = message;
        this.data = data;
        this.error = options.error ?? null;
        if (options.requestId) {
            this.requestId = options.requestId;
        }
        this.timestamp = getCurrentTimestamp();
    }

    static Ok<T>(
        data: T | null = null,
        message = "Requisição realizada com sucesso.",
        requestId?: string
    ): Response<T> {
        return new Response(data, 200, message, { success: true, requestId });
    }

    static NotFound<T>(
        message = "Recurso não encontrado.",
        requestId?: string
    ): Response<T> {
        return new Response(null, 404, message, {
            success: false,
            requestId,
            error: {
                code: "NOT_FOUND",
                message
            }
        });
    }

    static PayloadTooLarge<T>(
        message = "Tamanho da requisição excede o limite permitido.",
        requestId?: string
    ): Response<T> {
        return new Response(null, 413, message, {
            success: false,
            requestId,
            error: {
                code: "PAYLOAD_TOO_LARGE",
                message
            }
        });
    }

    static TooManyRequests<T>(
        message = "Muitas requisições em um curto período.",
        requestId?: string
    ): Response<T> {
        return new Response(null, 429, message, {
            success: false,
            requestId,
            error: {
                code: "TOO_MANY_REQUESTS",
                message
            }
        });
    }

    static Unauthorized<T>(
        message = "Acesso não autorizado.",
        requestId?: string
    ): Response<T> {
        return new Response(null, 401, message, {
            success: false,
            requestId,
            error: {
                code: "UNAUTHORIZED",
                message
            }
        });
    }

    static ServiceUnavailable<T>(
        message = "Serviço temporariamente indisponível.",
        requestId?: string
    ): Response<T> {
        return new Response(null, 503, message, {
            success: false,
            requestId,
            error: {
                code: "SERVICE_UNAVAILABLE",
                message
            }
        });
    }

    static BadGateway<T>(
        message = "Serviço de destino indisponível.",
        requestId?: string
    ): Response<T> {
        return new Response(null, 502, message, {
            success: false,
            requestId,
            error: {
                code: "BAD_GATEWAY",
                message
            }
        });
    }

    static GatewayTimeout<T>(
        message = "Tempo limite excedido ao comunicar com o serviço.",
        requestId?: string
    ): Response<T> {
        return new Response(null, 504, message, {
            success: false,
            requestId,
            error: {
                code: "GATEWAY_TIMEOUT",
                message
            }
        });
    }

    static InternalError<T>(
        message = "Erro interno no servidor gateway.",
        requestId?: string
    ): Response<T> {
        return new Response(null, 500, message, {
            success: false,
            requestId,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message
            }
        });
    }

    toPayload(): ResponsePayload<T> {
        const payload: ResponsePayload<T> = {
            success: this.success,
            status: this.status,
            statusText: this.statusText,
            message: this.message,
            timestamp: this.timestamp
        };

        if (this.requestId) {
            payload.requestId = this.requestId;
        }

        if (this.data !== null && this.data !== undefined) {
            payload.data = this.data;
        }

        if (this.error) {
            payload.error = this.error;
        }

        return payload;
    }
}
