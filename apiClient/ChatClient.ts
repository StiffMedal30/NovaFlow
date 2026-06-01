import config from "../src/appconfig.json";
import { getAuthHeaders } from "../src/store/authStore";

const API_BASE_URL = config.API_BASE_URL_DEV;

export interface ChatServiceResponse {
    message: string;
}

export const sendChatMessage = async (): Promise<ChatServiceResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/chat/test`, {
        method: "GET",
        headers: {
            ...getAuthHeaders(),
        },
    });

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error ?? payload.message ?? "Chat service did not respond.");
    }

    return payload as ChatServiceResponse;
};
