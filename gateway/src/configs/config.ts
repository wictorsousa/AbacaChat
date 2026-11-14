import dotenv from 'dotenv';
import { Config } from "../interfaces/config-interface.ts";

dotenv.config();


export const config: Config = {
    GATEWAY_PORT: parseInt(process.env.GATEWAY_PORT as string) || 3000,
    KERNEL_MODULE_URL: process.env.KERNEL_MODULE_URL as string || "http://localhost:3001",
    USER_MODULE_URL: process.env.USER_MODULE_URL as string || "http://localhost:3002",
    RECOMANDATION_MODULE_URL: process.env.RECOMANDATION_MODULE_URL as string || "http://localhost:3003",
    NOTIFICATION_MODULE_URL: process.env.NOTIFICATION_MODULE_URL as string || "http://localhost:3004",
    AUTHENTICATION_MODULE_URL: process.env.AUTHENTICATION_MODULE_URL as string || "http://localhost:3005",
    USER_NOTES_MODULE_URL: process.env.USER_NOTES_MODULE_URL as string || "http://localhost:3006"
};