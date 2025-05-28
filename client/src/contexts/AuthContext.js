import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.tokens.accessToken);
      if (action.payload.tokens.refreshToken) {
        localStorage.setItem('refreshToken', action.payload.tokens.refreshToken);
      }
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.tokens.accessToken,
        isAuthenticated: true,
        loading: false,
      };
    
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    
    case 'LOAD_USER_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    
    case 'LOAD_USER_FAIL':
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    if (state.token) {
      loadUser();
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getProfile();
      dispatch({ type: 'LOAD_USER_SUCCESS', payload: response.data.user });
    } catch (error) {
      dispatch({ type: 'LOAD_USER_FAIL' });
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'שגיאה בהתחברות' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'שגיאה בהרשמה' 
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Even if logout API fails, we still want to clear local state
      console.error('Logout API error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      dispatch({ type: 'UPDATE_USER', payload: response.data.user });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'שגיאה בעדכון פרופיל' 
      };
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await authAPI.refreshToken(refreshToken);
      localStorage.setItem('token', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      
      return response.data.tokens.accessToken;
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
      throw error;
    }
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
    loadUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 