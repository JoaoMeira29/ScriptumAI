"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

import {
  loginRequest,
  registerRequest,
  logoutRequest,
  refreshTokenRequest,
  getMeRequest,
  type User,
  type Trial,
  type LoginPayload,
  type RegisterPayload,
} from "@/services/auth-api";

const ACCESS_TOKEN_KEY = "scriptum_access_token";
const REFRESH_TOKEN_KEY = "scriptum_refresh_token";

type AuthContextValue = {
  user: User | null;
  trial: Trial | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [trial, setTrial] = useState<Trial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const getAccessToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }, []);

  const getRefreshToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  };

  const saveTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=3600`;
  };

  const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0`;
  };

  useEffect(() => {
    const bootstrap = async () => {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      if (!accessToken && !refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await getMeRequest(accessToken!);
        setUser(data.user);
        setTrial(data.trial ?? null);
      } catch {
        if (refreshToken) {
          try {
            const refreshed = await refreshTokenRequest(refreshToken);
            saveTokens(
              refreshed.data.accessToken,
              refreshed.data.refreshToken,
            );
            setUser(refreshed.data.user);
            setTrial(refreshed.data.trial ?? null);
          } catch {
            clearTokens();
          }
        } else {
          clearTokens();
        }
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await loginRequest(payload);
      saveTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      setTrial(data.trial ?? null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error signing in.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await registerRequest(payload);
      saveTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      setTrial(data.trial ?? null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error creating account.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    if (accessToken && refreshToken) {
      try {
        await logoutRequest(accessToken, refreshToken);
      } catch {
      }
    }
    clearTokens();
    setUser(null);
    setTrial(null);
    setError("");
  }, [getAccessToken]);

  const value = useMemo(
    () => ({
      user,
      trial,
      isAuthenticated: !!user,
      isLoading,
      error,
      login,
      register,
      logout,
      getAccessToken,
    }),
    [user, trial, isLoading, error, login, register, logout, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}