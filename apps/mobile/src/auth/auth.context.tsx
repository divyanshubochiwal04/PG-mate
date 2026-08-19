import React, { createContext, useEffect, useState } from 'react';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from './token.manager';
import { clearQueryCache } from '../config/query-client';
import { loginApi, registerApi } from '../api/auth.api';
import { setUnauthenticatedHandler } from '../api/client';
import type { LoginResponseData } from '../api/auth.api';

export interface AuthUser {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setUnauthenticatedHandler(() => {
      clearQueryCache();
      setIsAuthenticated(false);
      setUser(null);
    });

    async function hydrateAuthState(): Promise<void> {
      try {
        const accessToken = await getAccessToken();
        const refreshToken = await getRefreshToken();

        if (accessToken && refreshToken) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err: unknown) {
        console.warn('[AuthContext] Failed to hydrate auth state:', err);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void hydrateAuthState();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const data: LoginResponseData = await loginApi(email, password);
    const accessToken =
      data.tokens?.accessToken || (data as unknown as Record<string, string>).accessToken;
    const refreshToken =
      data.tokens?.refreshToken || (data as unknown as Record<string, string>).refreshToken;

    if (!accessToken || !refreshToken) {
      throw new Error('Authentication failed: Invalid token payload received from server');
    }

    await setAccessToken(accessToken);
    await setRefreshToken(refreshToken);
    setUser({
      id: data.user.id,
      organizationId: '',
      email: data.user.email,
      firstName: '',
      lastName: '',
      role: 'OWNER',
    });
    setIsAuthenticated(true);
  };

  const register = async (email: string, password: string): Promise<void> => {
    await registerApi(email, password);
    // After registration, automatically login
    await login(email, password);
  };

  const logout = async (): Promise<void> => {
    try {
      await clearTokens();
      clearQueryCache();
      setIsAuthenticated(false);
      setUser(null);
    } catch (err: unknown) {
      console.warn('[AuthContext] Error during logout token clearing:', err);
      clearQueryCache();
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
