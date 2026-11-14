import { getCurrentTimestamp } from "./current-timestamp";

export function getMockUserData() {
    return {
        mock: "This is a mock response from the gateway service.",
        mock_id: Math.floor(Math.random() * 1000),
        mock_email: `user${Math.floor(Math.random() * 1000)}@example.com`,
        mock_password: `password${Math.floor(Math.random() * 1000)}`,
        mock_name: `User${Math.floor(Math.random() * 1000)}`,
        mock_timestamp: getCurrentTimestamp()
    };
}