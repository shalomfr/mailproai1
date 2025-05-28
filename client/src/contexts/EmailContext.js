import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { emailAPI } from '../services/api';

const EmailContext = createContext();

const initialState = {
  accounts: [],
  loading: false,
  selectedAccount: null,
  providers: [],
  suggestions: [],
};

const emailReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'LOAD_ACCOUNTS_SUCCESS':
      return { ...state, accounts: action.payload, loading: false };
    
    case 'ADD_ACCOUNT_SUCCESS':
      return { 
        ...state, 
        accounts: [...state.accounts, action.payload],
        loading: false 
      };
    
    case 'UPDATE_ACCOUNT_SUCCESS':
      return {
        ...state,
        accounts: state.accounts.map(account =>
          account.id === action.payload.id ? action.payload : account
        ),
        loading: false
      };
    
    case 'DELETE_ACCOUNT_SUCCESS':
      return {
        ...state,
        accounts: state.accounts.filter(account => account.id !== action.payload),
        loading: false
      };
    
    case 'SELECT_ACCOUNT':
      return { ...state, selectedAccount: action.payload };
    
    case 'LOAD_PROVIDERS_SUCCESS':
      return { ...state, providers: action.payload };
    
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    
    default:
      return state;
  }
};

export const EmailProvider = ({ children }) => {
  const [state, dispatch] = useReducer(emailReducer, initialState);

  const loadAccounts = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await emailAPI.getAccounts();
      dispatch({ type: 'LOAD_ACCOUNTS_SUCCESS', payload: response.data.accounts });
    } catch (error) {
      console.error('Load accounts error:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addAccount = async (accountData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await emailAPI.createAccount(accountData);
      dispatch({ type: 'ADD_ACCOUNT_SUCCESS', payload: response.data.account });
      return { success: true, data: response.data };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'שגיאה ביצירת החשבון' 
      };
    }
  };

  const updateAccount = async (accountId, accountData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await emailAPI.updateAccount(accountId, accountData);
      dispatch({ type: 'UPDATE_ACCOUNT_SUCCESS', payload: response.data.account });
      return { success: true, data: response.data };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'שגיאה בעדכון החשבון' 
      };
    }
  };

  const deleteAccount = async (accountId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await emailAPI.deleteAccount(accountId);
      dispatch({ type: 'DELETE_ACCOUNT_SUCCESS', payload: accountId });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'שגיאה במחיקת החשבון' 
      };
    }
  };

  const testConnection = async (accountId) => {
    try {
      const response = await emailAPI.testAccount(accountId);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error?.message || 'שגיאה בבדיקת החיבור' 
      };
    }
  };

  const loadProviders = async () => {
    try {
      const response = await emailAPI.getProviders();
      dispatch({ type: 'LOAD_PROVIDERS_SUCCESS', payload: response.data.providers });
    } catch (error) {
      console.error('Load providers error:', error);
    }
  };

  const getSuggestions = async (query) => {
    try {
      const response = await emailAPI.getSuggestions(query);
      dispatch({ type: 'SET_SUGGESTIONS', payload: response.data.suggestions });
      return response.data.suggestions;
    } catch (error) {
      console.error('Get suggestions error:', error);
      return [];
    }
  };

  const detectProvider = async (email) => {
    try {
      const response = await emailAPI.detectProvider(email);
      return response.data;
    } catch (error) {
      console.error('Detect provider error:', error);
      return null;
    }
  };

  const value = {
    accounts: state.accounts,
    loading: state.loading,
    selectedAccount: state.selectedAccount,
    providers: state.providers,
    suggestions: state.suggestions,
    loadAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    testConnection,
    loadProviders,
    getSuggestions,
    detectProvider,
    selectAccount: (account) => dispatch({ type: 'SELECT_ACCOUNT', payload: account }),
  };

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
};

export const useEmail = () => {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
}; 