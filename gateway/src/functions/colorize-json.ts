import chalk from "chalk";

export function colorizeJson(data: unknown, indent = 0): string {
    const pad = "  ".repeat(indent);
    const innerPad = "  ".repeat(indent + 1);

    if (data === null || data === undefined) {
        return chalk.gray("null");
    }

    if (Array.isArray(data)) {
        if (data.length === 0) {
            return "[]";
        }

        const items = data.map(
            (item) => `${innerPad}${colorizeJson(item, indent + 1)}`
        );

        return `[\n${items.join(",\n")}\n${pad}]`;
    }

    if (typeof data === "object") {
        const entries = Object.entries(data as Record<string, unknown>);

        if (entries.length === 0) {
            return "{}";
        }

        const items = entries.map(
            ([key, value]) =>
                `${innerPad}${chalk.bold.white(JSON.stringify(key))}: ${colorizeJson(value, indent + 1)}`
        );

        return `{\n${items.join(",\n")}\n${pad}}`;
    }

    if (typeof data === "string") {
        return chalk.green(JSON.stringify(data));
    }

    if (typeof data === "number") {
        return chalk.yellow(String(data));
    }

    if (typeof data === "boolean") {
        return chalk.cyan(String(data));
    }

    return chalk.white(String(data));
}
