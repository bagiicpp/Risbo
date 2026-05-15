import React, { useState, useMemo } from "react";
import { AuthContext } from "../hooks/useAuth";
import type { AuthContextType } from "../hooks/useAuth";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("rizzbo_token");
  });

  const [loading] = useState<boolean>(false);

  const login = (newToken: string) => {
    localStorage.setItem("rizzbo_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("rizzbo_token");
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
