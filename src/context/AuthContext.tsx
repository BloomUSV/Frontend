import axios from 'axios';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { ReactNode } from 'react';

import type { AuthUser } from '../types/resource';

import { getApiErrorMessage } from '../services/apiError';

import * as authService from '../services/authService';

type AuthContextValue = {
  user: AuthUser | null;

  isLoading: boolean;

  error: string | null;

  login: (email: string, password: string) => Promise<void>;

  register: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<void>;

  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Provides session restoration and role-aware sign-in state to the app. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.removeItem('rrm.accessToken');

    authService
      .getCurrentUser()
      .then(setUser)
      .catch((requestError: unknown) => {
        if (
          axios.isAxiosError(requestError) &&
          requestError.response?.status === 401
        ) {
          setUser(null);
          return;
        }

        setError(
          getApiErrorMessage(requestError, 'Nu am putut verifica sesiunea.'),
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    setError(null);

    const result = await authService.login(email, password);
    setUser(result.user);
  }, []);

  const handleRegister = useCallback(
    async (fullName: string, email: string, password: string) => {
      setError(null);
      await authService.register(fullName, email, password);
    },
    [],
  );

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
      setError(null);
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError, 'Nu am putut încheia sesiunea.'),
      );
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
