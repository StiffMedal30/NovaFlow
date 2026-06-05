import type {
    FeasibilityResponse,
    Idea,
    IdeaRequest,
    IdeaResponse,
    IdeaStep,
    IdeaStepUpdate,
    TranscriptionResponse,
} from "../src/app/Types";
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

export const fetchIdea = async (ideaId: string): Promise<Idea> => {
    const response = await fetch(`${API_BASE_URL}/api/idea/${ideaId}`, {
        method: "GET",
        headers: {
            ...getAuthHeaders(),
        },
    });

    if (response.status === 401 || response.status === 403) {
        throw new Error("Sign in to load this idea.");
    }

    if (response.status === 404) {
        throw new Error("Idea not found.");
    }

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error ?? payload.message ?? "Could not load idea.");
    }

    return payload as Idea;
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

export const updateIdea = async (ideaId: string, idea: IdeaRequest): Promise<IdeaResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/idea/${ideaId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(idea),
    });

    if (response.status === 404) {
        throw new Error("Idea not found.");
    }

    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error ?? payload.message ?? "Could not update idea.");
    }

    return payload as IdeaResponse;
};

export const deleteIdea = async (ideaId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/idea/${ideaId}`, {
        method: "DELETE",
        headers: {
            ...getAuthHeaders(),
        },
    });

    if (response.status === 404) {
        throw new Error("Idea not found.");
    }

    if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? payload.message ?? "Could not delete idea.");
    }
};

export const generateFeasibilityStudy = async (ideaId: string, country: string): Promise<FeasibilityResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/idea/${ideaId}/feasibility`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify({ country }),
    });

    if (response.status === 404) {
        throw new Error("Idea not found.");
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error ?? payload.message ?? "Could not generate feasibility study.");
    }

    return payload as FeasibilityResponse;
};

export const updateIdeaStep = async (
    ideaId: string,
    stepId: string,
    step: IdeaStepUpdate
): Promise<IdeaStep> => {
    const response = await fetch(`${API_BASE_URL}/api/idea/${ideaId}/steps/${stepId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
        },
        body: JSON.stringify(step),
    });

    if (response.status === 404) {
        throw new Error("Idea step not found.");
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload.error ?? payload.message ?? "Could not update idea step.");
    }

    return payload as IdeaStep;
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
