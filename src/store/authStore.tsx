import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';

// Types
export interface User {
  username: string;
  token: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_AUTH'; payload: User | null };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

//Returns a new state after a certain action 
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'RESTORE_AUTH':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    default:
      return state;
  }
};

// For global accessibility
const AuthContext = createContext<{
  state: AuthState;
  login: (user: User) => void;
  logout: () => void;
  startLogin: () => void;
  loginFailure: () => void;
} | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore auth state from localStorage on app start
  useEffect(() => {
    const restoreAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const username = localStorage.getItem('username');

        if (token && username) {
          const user: User = { token, username };
          dispatch({ type: 'RESTORE_AUTH', payload: user });
        } else {
          dispatch({ type: 'RESTORE_AUTH', payload: null });
        }
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        dispatch({ type: 'RESTORE_AUTH', payload: null });
      }
    };

    restoreAuth();
  }, []);

  // Auth actions
  const startLogin = () => {
    dispatch({ type: 'LOGIN_START' });
  };

  const login = (user: User) => {
    // Store in localStorage
    localStorage.setItem('authToken', user.token);
    localStorage.setItem('username', user.username);
    
    // Update state
    dispatch({ type: 'LOGIN_SUCCESS', payload: user });
  };

  const loginFailure = () => {
    dispatch({ type: 'LOGIN_FAILURE' });
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    
    // Update state
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ state, login, logout, startLogin, loginFailure }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider :D');
  }
  return context;
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
