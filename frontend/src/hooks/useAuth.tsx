import { createContext, useContext } from "react";

export interface User {
  sub?: string;
  name?: string;
  role: "athlete" | "coach";
  plan?: string;
  exp?: number;
  [key: string]: any;
}

export interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
  // null = not yet loaded from /users/me; boolean once known.
  onboardingComplete: boolean | null;
  setOnboardingComplete: (v: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
