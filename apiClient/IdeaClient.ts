import type { Idea, IdeaRequest, IdeaResponse, TranscriptionResponse } from "../src/app/Types";
import { getAuthHeaders } from "../src/store/authStore";
import config from "../src/appconfig.json";

const API_BASE_URL = config.API_BASE_URL_DEV;

export const fetchIdeas = async (): Promise<Idea[]> => {
    const response = await fetch(`${API_BASE_URL}/api/idea`, {
        method: "GET",
        headers: {
            ...getAuthHeaders(),
        },
    });

    if (response.status === 404 || response.status === 405) {
        return [];
    }

    if (response.status === 401 || response.status === 403) {
        throw new Error("Sign in to load your ideas.");
    }

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error ?? payload.message ?? "Could not load ideas.");
    }

    return payload as Idea[];
};

export const createIdea = async (idea: IdeaRequest): Promise<IdeaResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/idea/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(idea),
    });

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error ?? payload.message ?? "Could not refine idea");
    }

    return payload as IdeaResponse;
};

export const transcribeIdeaAudio = async (audio: Blob): Promise<TranscriptionResponse> => {
    const formData = new FormData();
    formData.append("file", audio, "voice-idea.webm");

    const response = await fetch(`${API_BASE_URL}/api/ai/transcribe`, {
        method: "POST",
        headers: {
            ...getAuthHeaders(),
        },
        body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error ?? "Could not transcribe recording");
    }

    return payload as TranscriptionResponse;
};
