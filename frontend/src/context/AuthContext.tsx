import React, { useState, useMemo } from "react";
import { AuthContext } from "../hooks/useAuth";
import type { AuthContextType } from "../hooks/useAuth";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem("risbo_token");
    if (!stored || stored === "null" || stored === "undefined") {
      return null;
    }
    return stored;
  });

  const [loading] = useState<boolean>(false);

  const login = (newToken: string) => {
    localStorage.setItem("risbo_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("risbo_token");
    setToken(null);
  };

  const contextValue: AuthContextType = useMemo(
    () => ({
      token,
      isAuthenticated: !!token,
      login,
      logout,
      loading,
    }),
    [token, loading],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
