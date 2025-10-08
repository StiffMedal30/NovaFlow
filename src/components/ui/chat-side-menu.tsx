import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import { Plus, MessageSquare, Trash2, Home, Sparkles, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ChatSideMenu() {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { 
    getRecentSessions, 
    createSession, 
    setCurrentSession, 
    deleteSession, 
    currentSessionId 
  } = useChat();
  
  const recentSessions = getRecentSessions(20); // Get last 20 chats
  
  const handleNewChat = () => {
    createSession();
  };
  
  const handleSelectSession = (sessionId: string) => {
    setCurrentSession(sessionId);
  };
  
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the session
    deleteSession(sessionId);
  };
  
  return (
    <div 
      className="w-64 h-screen rounded-r-[18px] shadow-lg border-r border-t-0 border-b-0 border-l-0 py-6 px-4 flex flex-col fixed left-0 top-0 z-10"
      style={{
        background: currentTheme.colors.background,
        borderColor: currentTheme.colors.border,
        boxShadow: '2px 0 16px 0 rgba(0,0,0,0.08)',
        color: currentTheme.colors.text,
      }}
    >
        <div className='group flex items-center gap-3 mb-8'>
            <Sparkles
                size={24}
                color={'#7f5af0'}
            />
            <h1
            className="text-2xl font-normal text-text font-['Didact_Gothic']"
            >
                NovaFlow
            </h1>
        </div>
        {/* Home Button */}
        <button
            onClick={()=>{navigate('/home')}}
            className="flex items-center gap-3 px-3 py-2 mt-2 rounded-lg transition-all duration-200 border hover:scale-[1.00] text-sm"
            style={{
            borderColor: currentTheme.colors.background,
            background: currentTheme.colors.background,
            color: currentTheme.colors.text,
            }}
            onMouseEnter={(e) => {
            e.currentTarget.style.background = currentTheme.colors.primary;
            e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
            e.currentTarget.style.background = currentTheme.colors.background;
            e.currentTarget.style.color = currentTheme.colors.text;
            }}
        >
            <Home size={20} />
            <span>Home</span>
        </button>

      {/* New Chat Button */}
        <button
            onClick={handleNewChat}
            className="flex items-center gap-3 px-3 py-2 mt-2 rounded-lg transition-all duration-200 border hover:scale-[1.00] text-sm"
            style={{
            borderColor: currentTheme.colors.background,
            background: currentTheme.colors.background,
            color: currentTheme.colors.text,
            }}
            onMouseEnter={(e) => {
            e.currentTarget.style.background = currentTheme.colors.primary;
            e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
            e.currentTarget.style.background = currentTheme.colors.background;
            e.currentTarget.style.color = currentTheme.colors.text;
            }}
        >
            <Plus size={20} />
            <span>New Chat</span>
        </button>

        {/* Divider */}
        <div className="border-b my-2" />
      
      {/* Recent Chats */}
      <div className="flex flex-col gap-1 flex-grow overflow-y-auto">
        <h3 className="text-sm font-normal mb-2 opacity-70 flex items-center">
            <List size={16} className="inline-block mr-1" /> Recent Chats
        </h3>
        
        {recentSessions.length === 0 ? (
          <div className="text-sm opacity-50 text-center py-4">
            No recent chats
          </div>
        ) : (
          recentSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              className="group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer relative hover:scale-[1.00]"
              style={{
                background: session.id === currentSessionId 
                  ? currentTheme.colors.accent + '20' 
                  : 'transparent',
                borderLeft: session.id === currentSessionId 
                  ? `3px solid ${currentTheme.colors.accent}` 
                  : '3px solid transparent',
                color: currentTheme.colors.text,
              }}
              onMouseEnter={(e) => {
                if (session.id !== currentSessionId) {
                  e.currentTarget.style.background = currentTheme.colors.primary + '15';
                  e.currentTarget.style.borderLeft = `3px solid ${currentTheme.colors.primary}`;
                }
              }}
              onMouseLeave={(e) => {
                if (session.id !== currentSessionId) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeft = '3px solid transparent';
                }
              }}
            >
              <MessageSquare size={16} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">
                  {session.title}
                </div>
                <div className="text-xs opacity-50">
                  {session.messages.length} messages
                </div>
              </div>
              
              {/* Delete button */}
              <button
                onClick={(e) => handleDeleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                style={{ color: currentTheme.colors.text }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
