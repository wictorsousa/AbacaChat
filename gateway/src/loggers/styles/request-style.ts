import chalk from "chalk";
import { TypeOfRequest } from "../../enums/type-of-request-enum.ts";

export type RequestFieldKey =
    | "method"
    | "route"
    | "destination"
    | "status"
    | "message"
    | "duration"
    | "timestamp";

type ValuePainter = (value: string) => string;

export interface RequestStyle {
    title: string;
    paint: (message: string) => string;
    value: Record<RequestFieldKey, ValuePainter>;
}

function paintDuration(value: string): string {
    const duration = Number.parseFloat(value);

    if (duration < 100) {
        return chalk.green(value);
    }

    if (duration < 500) {
        return chalk.yellow(value);
    }

    return chalk.red(value);
}

export const requestStyles: Record<TypeOfRequest, RequestStyle> = {
    [TypeOfRequest.SUCCESS]: {
        title: "REQUEST APPROVED",
        paint: chalk.green,
        value: {
            method: chalk.yellow,
            route: chalk.cyan,
            destination: chalk.cyan,
            status: chalk.green,
            message: chalk.white,
            duration: paintDuration,
            timestamp: chalk.gray
        }
    },

    [TypeOfRequest.FAIL]: {
        title: "REQUEST FAILED",
        paint: chalk.red,
        value: {
            method: chalk.magenta,
            route: chalk.red,
            destination: chalk.red,
            status: chalk.red,
            message: chalk.redBright,
            duration: paintDuration,
            timestamp: chalk.gray
        }
    },

    [TypeOfRequest.NEUTRAL]: {
        title: "REQUEST INFO",
        paint: chalk.yellow,
        value: {
            method: chalk.cyan,
            route: chalk.cyan,
            destination: chalk.cyan,
            status: chalk.yellow,
            message: chalk.yellow,
            duration: paintDuration,
            timestamp: chalk.gray
        }
    }
};

export function getRequestStyle(status: number): RequestStyle {
    if (status >= 200 && status < 300) {
        return requestStyles[TypeOfRequest.SUCCESS];
    }

    if (status >= 400) {
        return requestStyles[TypeOfRequest.FAIL];
    }

    return requestStyles[TypeOfRequest.NEUTRAL];
}
