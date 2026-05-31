import React, { useState, useMemo, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "../hooks/useAuth";
import type { AuthContextType, User } from "../hooks/useAuth";
import { useTheme } from "@/context/ThemeProvider";
import api from "@/lib/api";

interface AuthProviderProps {
  children: React.ReactNode;
}

const getValidStoredToken = (): string | null => {
  const stored = localStorage.getItem("risbo_token");
  if (!stored || stored === "null" || stored === "undefined") return null;

  try {
    const decoded = jwtDecode<{ exp?: number }>(stored);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("risbo_token");
      return null;
    }
    return stored;
  } catch {
    localStorage.removeItem("risbo_token");
    return null;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getValidStoredToken);
  const [loading] = useState<boolean>(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null,
  );

  const { theme, setTheme } = useTheme();

  const user = useMemo<User | null>(() => {
    if (!token) return null;
    try {
      return jwtDecode<User>(token);
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setOnboardingComplete(null);
      return;
    }

    const syncFromServer = async () => {
      try {
        const response = await api.get("/users/me");
        const dbTheme = response.data.preferences?.theme;

        if (dbTheme && dbTheme !== theme) {
          setTheme(dbTheme as "light" | "dark" | "system");
        }

        setOnboardingComplete(Boolean(response.data.onboarding_complete));
      } catch (error) {
        console.error("Failed to sync remote state on boot:", error);
        // Don't trap the user in an onboarding redirect loop if the fetch fails.
        setOnboardingComplete(true);
      }
    };

    syncFromServer();
  }, [token]);

  const login = (newToken: string) => {
    try {
      const decoded = jwtDecode<{ exp?: number }>(newToken);
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.warn("Attempted to login with an expired token.");
        return;
      }
      localStorage.setItem("risbo_token", newToken);
      setToken(newToken);
    } catch (error) {
      console.error("Invalid token provided to login", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("risbo_token");
    setToken(null);
    setOnboardingComplete(null);
  };

  const contextValue: AuthContextType = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: !!token && !!user,
      login,
      logout,
      loading,
      onboardingComplete,
      setOnboardingComplete,
    }),
    [token, user, loading, onboardingComplete],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
