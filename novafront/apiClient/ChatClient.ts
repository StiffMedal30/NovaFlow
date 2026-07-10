import { API_BASE_URL } from "./apiBase";
import { getAuthHeaders } from "../src/store/authStore";

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
