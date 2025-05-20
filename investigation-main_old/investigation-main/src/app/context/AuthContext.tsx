/* eslint-disable */
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthState } from '../types';
import apiService from '@/services/api';
import defaultSettings from '@/config/defaultSettings.json';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
          // Validate token with API
          try {
            // Get auth endpoint from config
            const authEndpoint = defaultSettings.api.endpoints.auth;

            // Validate token with API
            const validationResponse = await apiService.get(`${authEndpoint}/validate`, {
              headers: {
                Authorization: `Bearer ${storedToken}`
              }
            });

            // Check if the validation response is valid
            if (!validationResponse || !validationResponse.valid) {
              throw new Error('Invalid token');
            }

            // If validation succeeds, set user as authenticated
            setState({
              user: JSON.parse(storedUser),
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            // If validation fails, clear stored data
            console.error('Token validation failed:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setState({
              ...initialState,
              isLoading: false,
            });
          }
        } else {
          setState({
            ...initialState,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setState({
          ...initialState,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Always use the mock login for now to avoid API errors
      if (email === 'admin@police.gov' && password === 'password') {
        // Import mock data dynamically
        const { default: mockApi } = await import('@/mocks/api');
        const mockResponse = mockApi['/auth/login'];

        setState({
          user: mockResponse.user,
          isAuthenticated: true,
          isLoading: false,
        });

        localStorage.setItem('user', JSON.stringify(mockResponse.user));
        localStorage.setItem('token', mockResponse.token);

        return true;
      }

      // If not using mock credentials, try the API
      // Get auth endpoint from config
      const authEndpoint = defaultSettings.api.endpoints.auth;

      try {
        // Make API call to authenticate
        const response = await apiService.post(`${authEndpoint}/login`, {
          email,
          password
        });

        // If login succeeds, set user as authenticated
        if (response && response.user && response.token) {
          setState({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });

          // Store user and token in localStorage
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('token', response.token);

          return true;
        }
      } catch (apiError) {
        console.error('API login error:', apiError);
        // Continue to return false below
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Get auth endpoint from config
      const authEndpoint = defaultSettings.api.endpoints.auth;

      // Get token from localStorage
      const token = localStorage.getItem('token');

      if (token) {
        // Make API call to logout
        await apiService.post(`${authEndpoint}/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user state and localStorage regardless of API success
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      // Remove user and token from localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      // Redirect to login page
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
