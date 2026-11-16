export interface RequestContext {
    requestId: string;
    method: string;
    route: string;
    serviceName: string;
    destination: string;
    clientIp: string;
    userAgent: string;
    httpVersion: string;
    headers: Record<string, string | string[] | undefined>;
    duration: number;
    timestamp: string;
}
