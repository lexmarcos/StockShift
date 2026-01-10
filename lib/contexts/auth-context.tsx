"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface User {
  userId: string;
  email: string;
  fullName: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = "user-data";
const WAREHOUSE_STORAGE_KEY = "selected-warehouse-id";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setUserState(parsed);
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const setUser = (user: User | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  const logout = async () => {
    try {
      await api.post("auth/logout");
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(WAREHOUSE_STORAGE_KEY);
      setUserState(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
