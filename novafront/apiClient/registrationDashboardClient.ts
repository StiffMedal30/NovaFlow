import { API_BASE_URL } from "./apiBase";
import { getAuthHeaders } from "../src/store/authStore";

export interface RegisteredUserSummary {
  email: string;
  registeredAt: string;
  lastLoginAt: string | null;
}

export const getRegisteredUsers = async (): Promise<RegisteredUserSummary[]> => {
  const response = await fetch(`${API_BASE_URL}/api/user/registrations`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error || (response.status === 403 ? "Access denied" : "Could not load registrations"));
  }
  return response.json();
};
