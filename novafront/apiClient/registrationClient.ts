import config from "../src/appconfig.json";

const API_BASE_URL = config.API_BASE_URL_DEV;

export interface RegistrationRequest {
  email: string;
  username: string;
  password: string;
  name?: string;
}

export interface RegistrationResponse {
  message: string;
}

export const register = async (
  registration: RegistrationRequest,
): Promise<RegistrationResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/user/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(registration),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || "Registration failed");
  }
  return data;
};

export const isGoogleOAuthEnabled = async (): Promise<boolean> => {
  const response = await fetch(`${API_BASE_URL}/api/oauth/google/status`);
  if (!response.ok) {
    return false;
  }
  const data = await response.json();
  return Boolean(data.enabled);
};

export const startGoogleOAuth = () => {
  window.location.assign(`${API_BASE_URL}/oauth2/authorization/google`);
};
