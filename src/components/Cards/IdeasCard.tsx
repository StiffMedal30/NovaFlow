import { useTheme } from "../../context/ThemeContext";
import { ArrowRight, Clock, Lightbulb, StickyNote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Idea } from "../../app/Types";
import { useEffect, useState } from "react";
import { fetchIdeas } from "../../../apiClient/IdeaClient";

function IdeasCard() {
    const { currentTheme } = useTheme();
    const navigate = useNavigate();

    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    async function getIdeas() {
        setLoading(true);
        setErrorMessage("");
        try {
            const response = await fetchIdeas();
            setIdeas(response);
        } catch (error) {
            console.error("Error fetching ideas:", error);
            setIdeas([]);
            setErrorMessage(error instanceof Error ? error.message : "Could not load ideas.");
        } finally {
            setLoading(false);
        }
    }

    //Fetch Ideas on mount
    useEffect(() => {
        getIdeas();
    }, []);

    function handleIdeaClick(ideaId: string) {
        navigate(`/idea/${ideaId}`);
    }

    return (
        <div
            className="w-full h-full mx-auto bg-background"
            style={{
                borderRadius: 18,
                boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)",
                border: `1.5px solid ${currentTheme.colors.border}`,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: currentTheme.colors.border }}>
                <div className="flex items-center gap-3">
                    <Lightbulb size={24} className="text-primary" />
                    <h2 className="text-xl font-semibold text-text">Recent Ideas</h2>
                </div>
                <button
                    onClick={() => navigate('/idea')}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:text-text hover:bg-primary transition-colors rounded-lg"
                >
                    View All <ArrowRight size={16} />
                </button>
            </div>

            {/* Body */}
            <div className="p-6">
                {loading ? (
                    <>Loading...</>
                ) : errorMessage ? (
                    <p className="text-sm opacity-70">{errorMessage}</p>
                ) : ideas.length === 0 ? (
                    <p className="text-sm opacity-70">No ideas returned yet.</p>
                ) : (
                    <div>
                        {ideas.map((idea) => (
                            <button
                                type="button"
                                className="group flex w-full items-start gap-4 rounded-lg p-4 text-left transition-colors"
                                style={{ 
                                    background: 'transparent',
                                    border: `1px solid transparent`,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.border = `1px solid ${currentTheme.colors.primary}20`;
                                    e.currentTarget.style.background = `${currentTheme.colors.primary}08`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.border = '1px solid transparent';
                                    e.currentTarget.style.background = 'transparent';
                                }}
                                key={idea.id}
                                onClick={() => handleIdeaClick(idea.id)}
                            >
                                {/*Idea Icon*/}
                                <div className="flex-shrink-0 p-2 rounded-lg" style={{ background: `${currentTheme.colors.primary}15` }}>
                                    <StickyNote size={16} className="text-primary" />
                                </div>

                                {/*Idea Text*/}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-text group-hover:text-primary transition-colors truncate">
                                        {idea.title}
                                    </h4>
                                    <div className="flex items-center gap-1 mt-2 text-xs text-text opacity-50">
                                        <Clock size={12} />
                                        {idea.createdDate}
                                    </div>
                                </div>

                                {/*Arrow Right*/}
                                <ArrowRight size={16} className="text-text opacity-30 group-hover:opacity-60 group-hover:text-primary transition-all" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export { IdeasCard };
