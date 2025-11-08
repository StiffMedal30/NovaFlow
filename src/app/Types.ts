// ------------------------------------------------------
// Ideas
// ------------------------------------------------------
export type IdeaStatus = 'ACTIVE' | 'DELETED' | 'ARCHIVED' | 'DRAFT';

export interface Idea {
    id: string;
    title: string;
    description: string;
    createdBy: string;
    createdDate: string;
    updatedDate?: string;
    status: IdeaStatus;
    aiProcessed: boolean;
    aiResponse: string;
}

// ------------------------------------------------------
// Chats
// ------------------------------------------------------

// TODO : Move chat types to here