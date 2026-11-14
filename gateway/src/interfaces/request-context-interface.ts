export interface RequestContext {
    method: string;
    route: string;
    destination: string;
    duration: number;
}