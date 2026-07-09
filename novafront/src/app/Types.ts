// ------------------------------------------------------
// Ideas
// ------------------------------------------------------
export type IdeaStatus = 'ACTIVE' | 'DELETED' | 'ARCHIVED' | 'DRAFT';

export interface Idea {
    id: string;
    title: string;
    description: string;
    problem: string;
    goal: string;
    targetUsers: string;
    mustHaveFeatures: string;
    constraints: string;
    techPreferences: string;
    unknowns: string;
    createdBy: string;
    createdDate: string;
    updatedDate?: string;
    status: IdeaStatus;
    aiProcessed: boolean;
    aiResponse: string;
    feasibilityCountry: string;
    feasibilityResponse: string;
    steps: IdeaStep[];
}

export interface IdeaRequest {
    title: string;
    description: string;
    problem: string;
    goal: string;
    targetUsers: string;
    mustHaveFeatures: string;
    constraints: string;
    techPreferences: string;
    unknowns: string;
}

export interface IdeaResponse {
    ideaId: string | null;
    message: string;
    refinement: string | null;
    steps: IdeaStep[];
}

export type IdeaRefinementAction = 'EXPLAIN' | 'CHALLENGE' | 'EXPAND' | 'REWRITE' | 'SIMPLIFY' | 'ADD_STEPS';

export interface IdeaRefinementRequest {
    action: IdeaRefinementAction;
    sectionTitle: string;
    sectionContent: string;
    instruction: string;
}

export interface IdeaRefinementResponse {
    ideaId: string;
    message: string;
    refinement: string;
    assistantOutput: string;
    planUpdated: boolean;
    steps: IdeaStep[];
}

export type IdeaStepPriority = 'P0' | 'P1' | 'P2';

export interface IdeaStep {
    id: string;
    position: number;
    title: string;
    details: string;
    priority: IdeaStepPriority;
    owner: string;
    dueDate: string | null;
    completed: boolean;
}

export interface IdeaStepUpdate {
    priority: IdeaStepPriority;
    owner: string;
    dueDate: string | null;
    completed: boolean;
}

export interface FeasibilityResponse {
    country: string;
    study: string;
}

export interface TranscriptionResponse {
    text: string;
}

export interface RefinedIdea {
    idea: Idea;
    refinedRequest: RefinedRequest;
}

export interface RefinedRequest {
    audience?: string;
    focusAreas?: string[];
    tone?: string;
}

// ------------------------------------------------------
// Chats
// ------------------------------------------------------

// TODO : Move chat types to here
