import chalk from "chalk";
import { getCurrentTimestamp } from "../functions/current-timestamp.ts";
import { getRequestStyle } from "./styles/request-style.ts";
import type { RequestLog } from "../interfaces/request-log-interface.ts";
import { formatField } from "../functions/format-field.ts";
import { colorizeJson } from "../functions/colorize-json.ts";

export const logger = {
    title(message: string) {
        console.log(`\n${chalk.bold.cyanBright(message.toUpperCase())}\n`);
    },
    info(message: string, options: { leadingNewline?: boolean } = {}) {
        const prefix = options.leadingNewline ? "\n" : "";
        console.log(`${prefix}[${chalk.bold.cyanBright(getCurrentTimestamp())}] ${chalk.bold.magentaBright("[INFO]: ")} ${chalk.white(message)}`);
    },
    warn(message: string) {
        console.log(`[${chalk.bold.cyanBright(getCurrentTimestamp())}] ${chalk.bold.yellow("[WARN]: ")} ${chalk.white(message)}`);
    },
    error(message: string) {
        console.log(`[${chalk.bold.cyanBright(getCurrentTimestamp())}] ${chalk.bold.red("[ERROR]: ")} ${chalk.white(message)}`);
    },
    request<T>({ context, response }: RequestLog<T>) {
        const style = getRequestStyle(response.status);
        const hasData = response.data !== null && response.data !== undefined;

        const lines = [
            `${style.paint(style.title)}`,
            formatField(style, "method", context.method),
            formatField(style, "route", context.route),
            formatField(style, "destination", context.destination),
            formatField(style, "status", `${response.status} ${response.statusText}`),
            formatField(style, "message", response.message),
            formatField(style, "duration", `${context.duration}ms`),
            formatField(style, "timestamp", response.timestamp)
        ];

        if (hasData) {
            lines.push(`${chalk.bold.white("Data:")} ${colorizeJson(response.data)}`);
        }

        console.log(lines.join("\n"));
    }
};
