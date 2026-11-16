import { config } from "../configs/config";

export interface Match {
    target: string;
    service: string;
}

export const routes: Record<string, Match> = {
    "kernel": { target: config.KERNEL_MODULE_URL, service: "kernel" },
    "user": { target: config.USER_MODULE_URL, service: "user" },
    "recommendation": { target: config.RECOMANDATION_MODULE_URL, service: "recommendation" },
    "notification": { target: config.NOTIFICATION_MODULE_URL, service: "notification" },
    "authentication": { target: config.AUTHENTICATION_MODULE_URL, service: "authentication" },
    "user-notes": { target: config.USER_NOTES_MODULE_URL, service: "user-notes" }
}