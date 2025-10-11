import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useChat } from "../../context/ChatContext";
import { MessageSquare, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Chats() {
  const { currentTheme } = useTheme();
  const { sessions, setCurrentSession } = useChat();
  const navigate = useNavigate();

  const recentSessions = sessions
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5); // Show only the 5 most recent chats

  const handleChatClick = (sessionId: string) => {
    setCurrentSession(sessionId);
    navigate('/chat');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className="w-full h-full mx-auto mt-18 bg-background"
      style={{
        borderRadius: 18,
        boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)",
        border: `1.5px solid ${currentTheme.colors.border}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: currentTheme.colors.border }}>
        <div className="flex items-center gap-3">
          <MessageSquare size={24} className="text-primary" />
          <h2 className="text-xl font-semibold text-text">Recent Conversations</h2>
        </div>
        <button
          onClick={() => navigate('/chat')}
          className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:text-text hover:bg-primary transition-colors rounded-lg"
        >
          View All <ArrowRight size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="p-6">
        {recentSessions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare size={48} className="mx-auto mb-4 text-text opacity-30" />
            <h3 className="text-lg font-medium text-text mb-2">No conversations yet</h3>
            <p className="text-text opacity-60 mb-6">
              Start your first conversation to see it appear here
            </p>
            <button
              onClick={() => navigate('/chat')}
              className="px-6 py-3 bg-primary text-text rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Start Chatting
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleChatClick(session.id)}
                className="group flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors hover:bg-primary/5"
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
              >
                <div className="flex-shrink-0 p-2 rounded-lg" style={{ background: `${currentTheme.colors.primary}15` }}>
                  <MessageSquare size={16} className="text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-text group-hover:text-primary transition-colors truncate">
                    {session.title}
                  </h4>
                  <p className="text-sm text-text opacity-60 mt-1">
                    {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-text opacity-50">
                    <Clock size={12} />
                    {formatDate(session.updatedAt)}
                  </div>
                </div>
                
                <ArrowRight size={16} className="text-text opacity-30 group-hover:opacity-60 group-hover:text-primary transition-all" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { Chats };
