import chalk from "chalk";
import { getRequestStyle } from "../loggers/styles/request-style.ts";
import type { RequestFieldKey } from "../loggers/styles/request-style.ts";

type RequestStyle = ReturnType<typeof getRequestStyle>;

const FIELD_LABELS: Record<RequestFieldKey, string> = {
    requestId: "Request ID",
    serviceName: "Service",
    clientIp: "Client IP",
    protocol: "Protocol",
    userAgent: "User Agent",
    method: "Method",
    route: "Route",
    destination: "Destination",
    status: "Status",
    message: "Message",
    duration: "Duration",
    timestamp: "Timestamp"
};

export function formatField(
    style: RequestStyle,
    key: RequestFieldKey,
    value: string
): string {
    return `${chalk.bold.white(`${FIELD_LABELS[key]}:`)} ${style.value[key](value)}`;
}
