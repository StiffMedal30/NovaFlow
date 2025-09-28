import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { type ChatMessage } from '../components/ui/chat-message';

// Types
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}

export interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Actions
type ChatAction =
  | { type: 'CREATE_SESSION'; payload: { title?: string; sessionId: string } }
  | { type: 'SET_CURRENT_SESSION'; payload: { sessionId: string } }
  | { type: 'ADD_MESSAGE'; payload: { sessionId: string; message: ChatMessage } }
  | { type: 'UPDATE_MESSAGE'; payload: { sessionId: string; messageId: string; updates: Partial<ChatMessage> } }
  | { type: 'DELETE_SESSION'; payload: { sessionId: string } }
  | { type: 'UPDATE_SESSION_TITLE'; payload: { sessionId: string; title: string } }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean } }
  | { type: 'SET_ERROR'; payload: { error: string | null } }
  | { type: 'LOAD_SESSIONS'; payload: { sessions: ChatSession[] } }
  | { type: 'CLEAR_CURRENT_SESSION' };

// Initial state
const initialState: ChatState = {
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  error: null,
  isInitialized: false, // Add flag to track initialization
};

// Reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'CREATE_SESSION': {
      const newSession: ChatSession = {
        id: action.payload.sessionId,
        title: action.payload.title || 'New Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };
      
      return {
        ...state,
        sessions: [newSession, ...state.sessions],
        currentSessionId: newSession.id,
        error: null,
      };
    }
    
    case 'SET_CURRENT_SESSION': {
      return {
        ...state,
        currentSessionId: action.payload.sessionId,
        error: null,
      };
    }
    
    case 'ADD_MESSAGE': {
      const { sessionId, message } = action.payload;
      
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === sessionId
            ? {
                ...session,
                messages: [...session.messages, message],
                updatedAt: new Date(),
                // Auto-update title based on first user message
                title: session.messages.length === 0 && message.sender === 'user'
                  ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
                  : session.title,
              }
            : session
        ),
      };
    }
    
    case 'UPDATE_MESSAGE': {
      const { sessionId, messageId, updates } = action.payload;
      
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === sessionId
            ? {
                ...session,
                messages: session.messages.map(msg =>
                  msg.id === messageId ? { ...msg, ...updates } : msg
                ),
                updatedAt: new Date(),
              }
            : session
        ),
      };
    }
    
    case 'DELETE_SESSION': {
      const filteredSessions = state.sessions.filter(s => s.id !== action.payload.sessionId);
      
      return {
        ...state,
        sessions: filteredSessions,
        currentSessionId: state.currentSessionId === action.payload.sessionId
          ? (filteredSessions.length > 0 ? filteredSessions[0].id : null)
          : state.currentSessionId,
      };
    }
    
    case 'UPDATE_SESSION_TITLE': {
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.sessionId
            ? { ...session, title: action.payload.title, updatedAt: new Date() }
            : session
        ),
      };
    }
    
    case 'SET_LOADING': {
      return {
        ...state,
        isLoading: action.payload.isLoading,
      };
    }
    
    case 'SET_ERROR': {
      return {
        ...state,
        error: action.payload.error,
        isLoading: false,
      };
    }
    
    case 'LOAD_SESSIONS': {
      return {
        ...state,
        sessions: action.payload.sessions,
        isLoading: false,
        error: null,
        isInitialized: true, // Mark as initialized after loading
      };
    }
    
    case 'CLEAR_CURRENT_SESSION': {
      return {
        ...state,
        currentSessionId: null,
      };
    }
    
    default:
      return state;
  }
}

// Context
interface ChatContextType extends ChatState {
  // Session management
  createSession: (title?: string) => string;
  setCurrentSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  clearCurrentSession: () => void;
  
  // Message management  
  addMessage: (message: Omit<ChatMessage, 'id'>) => string;
  addMessageToSession: (sessionId: string, message: Omit<ChatMessage, 'id'>) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  
  // Getters
  getCurrentSession: () => ChatSession | null;
  getRecentSessions: (limit?: number) => ChatSession[];
  
  // Utility
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEY = 'novaflow_chat_sessions';
const CURRENT_SESSION_KEY = 'novaflow_current_session';

// Provider
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  
  // Load sessions from localStorage on mount (TODO: Change to load from api when available)
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem(STORAGE_KEY);
      const savedCurrentSession = localStorage.getItem(CURRENT_SESSION_KEY);
      
      if (savedSessions) {
        const sessions: ChatSession[] = JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        
        dispatch({ type: 'LOAD_SESSIONS', payload: { sessions } });
        
        if (savedCurrentSession && sessions.find(s => s.id === savedCurrentSession)) {
          dispatch({ type: 'SET_CURRENT_SESSION', payload: { sessionId: savedCurrentSession } });
        }
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      dispatch({ type: 'SET_ERROR', payload: { error: 'Failed to load chat history' } });
    }
  }, []);
  
  // Save sessions to localStorage whenever sessions change (but only after initialization)
  useEffect(() => {
    if (!state.isInitialized) {
      return;
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.sessions));
    } catch (error) {
      console.error('Failed to save chat sessions:', error);
    }
  }, [state.sessions, state.isInitialized]);
  
  // Save current session whenever it changes
  useEffect(() => {
    try {
      if (state.currentSessionId) {
        localStorage.setItem(CURRENT_SESSION_KEY, state.currentSessionId);
      } else {
        localStorage.removeItem(CURRENT_SESSION_KEY);
      }
    } catch (error) {
      console.error('Failed to save current session:', error);
    }
  }, [state.currentSessionId]);
  
  // Session management
  const createSession = useCallback((title?: string): string => {
    const sessionId = Date.now().toString();
    dispatch({ type: 'CREATE_SESSION', payload: { title, sessionId } });
    return sessionId;
  }, []);
  
  const setCurrentSession = useCallback((sessionId: string) => {
    dispatch({ type: 'SET_CURRENT_SESSION', payload: { sessionId } });
  }, []);
  
  const deleteSession = useCallback((sessionId: string) => {
    dispatch({ type: 'DELETE_SESSION', payload: { sessionId } });
  }, []);
  
  const updateSessionTitle = useCallback((sessionId: string, title: string) => {
    dispatch({ type: 'UPDATE_SESSION_TITLE', payload: { sessionId, title } });
  }, []);
  
  const clearCurrentSession = useCallback(() => {
    dispatch({ type: 'CLEAR_CURRENT_SESSION' });
  }, []);
  
  // Message management
  const addMessage = useCallback((message: Omit<ChatMessage, 'id'>): string => {
    let targetSessionId = state.currentSessionId;
    
    if (!targetSessionId) {
      // Auto-create session if none exists
      targetSessionId = createSession();
    }
    
    const messageWithId: ChatMessage = {
      ...message,
      id: Date.now().toString() + '-' + message.sender,
    };
    
    dispatch({ type: 'ADD_MESSAGE', payload: { sessionId: targetSessionId, message: messageWithId } });
    return targetSessionId;
  }, [state.currentSessionId, createSession]);
  
  const addMessageToSession = useCallback((sessionId: string, message: Omit<ChatMessage, 'id'>) => {
    const messageWithId: ChatMessage = {
      ...message,
      id: Date.now().toString() + '-' + message.sender,
    };
    
    dispatch({ type: 'ADD_MESSAGE', payload: { sessionId, message: messageWithId } });
  }, []);
  
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    if (state.currentSessionId) {
      dispatch({ 
        type: 'UPDATE_MESSAGE', 
        payload: { sessionId: state.currentSessionId, messageId, updates } 
      });
    }
  }, [state.currentSessionId]);
  
  // Getters
  const getCurrentSession = useCallback((): ChatSession | null => {
    return state.sessions.find(s => s.id === state.currentSessionId) || null;
  }, [state.sessions, state.currentSessionId]);
  
  const getRecentSessions = useCallback((limit: number = 10): ChatSession[] => {
    return state.sessions
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }, [state.sessions]);
  
  // Utility
  const setLoading = useCallback((isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading } });
  }, []);
  
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: { error } });
  }, []);
  
  const value: ChatContextType = {
    ...state,
    createSession,
    setCurrentSession,
    deleteSession,
    updateSessionTitle,
    clearCurrentSession,
    addMessage,
    addMessageToSession,
    updateMessage,
    getCurrentSession,
    getRecentSessions,
    setLoading,
    setError,
  };
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// Hook
export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}