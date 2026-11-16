import { routes } from "../interfaces/match-interface.ts";

export interface RouteMatch {
    targetUrl: string;
    serviceName: string;
}

export function resolveRoute(requestUrl: string): RouteMatch | null {
    const parsed = new URL(requestUrl, "http://localhost");
    const pathname = parsed.pathname;

    const routeEntries = Object.entries(routes).sort(
        ([a], [b]) => b.length - a.length
    );

    for (const [key, route] of routeEntries) {
        const prefix = `/${key}`;
        const matchesExact = pathname === prefix;
        const matchesSubPath = pathname.startsWith(`${prefix}/`);

        if (matchesExact || matchesSubPath) {
            const subPath = pathname.slice(prefix.length);
            const normalizedPath = subPath.length === 0 ? "/" : subPath;
            const cleanBase = route.target.replace(/\/+$/, "");

            return {
                targetUrl: `${cleanBase}${normalizedPath}${parsed.search}`,
                serviceName: route.service
            };
        }
    }

    return null;
}
