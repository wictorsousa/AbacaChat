import { getCurrentTimestamp } from "../functions/current-timestamp.ts";
import { STATUS_CODES } from "node:http";

export class Response<T> {
    status: number;
    statusText: string;
    message: string;
    data: T | null;
    timestamp: string;

    constructor(data: T | null, status: number, message: string) {
        this.status = status;
        this.statusText = STATUS_CODES[status] ?? "Unknown Status";
        this.message = message;
        this.data = data;
        this.timestamp = getCurrentTimestamp();
    }

    static Ok<T>(
        data: T | null = null,
        message = "Requisição realizada com sucesso."
    ): Response<T> {
        return new Response(data, 200, message);
    }

    static NotFound<T>(
        data: T | null = null,
        message = "Recurso não encontrado."
    ): Response<T> {
        return new Response(data, 404, message);
    }

    static InternalError<T>(
        data: T | null = null,
        message = "Erro interno no servidor."
    ): Response<T> {
        return new Response(data, 500, message);
    }
}