import dotenv from "dotenv";
import { Config } from "../interfaces/config-interface.ts";

dotenv.config({ override: true });

export const config: Config = {
    GATEWAY_PORT: parseInt(process.env.GATEWAY_PORT as string) || 3030,
    KERNEL_MODULE_URL: process.env.KERNEL_MODULE_URL as string || "http://localhost:3031",
    USER_MODULE_URL: process.env.USER_MODULE_URL as string || "http://localhost:3032",
    RECOMANDATION_MODULE_URL: process.env.RECOMANDATION_MODULE_URL as string || "http://localhost:3033",
    NOTIFICATION_MODULE_URL: process.env.NOTIFICATION_MODULE_URL as string || "http://localhost:3034",
    AUTHENTICATION_MODULE_URL: process.env.AUTHENTICATION_MODULE_URL as string || "http://localhost:3035",
    USER_NOTES_MODULE_URL: process.env.USER_NOTES_MODULE_URL as string || "http://localhost:3036"
};
