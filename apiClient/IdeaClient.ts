import type { Idea } from "../src/app/Types";

//Return a list of mock ideas
export const fetchIdeas = async (): Promise<Idea[]> => {

    const mockIdeas: Idea[] = [
        { id: '1', title: 'First Idea', description: 'This is the first idea.', aiProcessed: false, aiResponse: '', createdBy: '', createdDate: '9 May 2025', updatedDate: '', status: 'ACTIVE' },
        { id: '2', title: 'Second Idea', description: 'This is the second idea.', aiProcessed: false, aiResponse: '', createdBy: '', createdDate: '16 March 2025', updatedDate: '', status: 'ACTIVE' },
        { id: '3', title: 'Third Idea', description: 'This is the third idea.', aiProcessed: false, aiResponse: '', createdBy: '', createdDate: '24 July 2025', updatedDate: '', status: 'ACTIVE' },
        { id: '4', title: 'Fourth Idea', description: 'This is the fourth idea.', aiProcessed: false, aiResponse: '', createdBy: '', createdDate: '10 November 2025', updatedDate: '', status: 'ACTIVE' },
    ];
    return mockIdeas;
};
