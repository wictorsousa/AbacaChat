import chalk from "chalk";
import { getRequestStyle } from "../loggers/styles/request-style";
import type { RequestFieldKey } from "../loggers/styles/request-style";

type RequestStyle = ReturnType<typeof getRequestStyle>;

const FIELD_LABELS: Record<RequestFieldKey, string> = {
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