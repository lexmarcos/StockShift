"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";

interface BaseUser {
  userId: string;
  email: string;
  fullName: string;
}

interface User extends BaseUser {
  tenantId: string;
  roles: string[];
  permissions: string[];
  mustChangePassword: boolean;
}

interface MeResponse {
  success: boolean;
  data: {
    id: string;
    tenantId: string;
    email: string;
    fullName: string;
    mustChangePassword: boolean;
    roles: string[];
    permissions: string[];
  };
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: BaseUser | null) => void;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = "user-data";
const WAREHOUSE_STORAGE_KEY = "selected-warehouse-id";

const fetcher = (url: string) => api.get(url).json<MeResponse>();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [baseUser, setBaseUserState] = useState<BaseUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();

  // Fetch complete user data with roles/permissions
  const {
    data: meData,
    isLoading: isMeLoading,
    mutate: mutateMe,
  } = useSWR<MeResponse>(baseUser ? "auth/me" : null, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
    onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
      // Não retenta em erros de autenticação (403) para evitar loop
      if (error?.response?.status === 403) return;
      // Para outros erros, retry com backoff (max 3 tentativas)
      if (retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount }), 5000 * (retryCount + 1));
    },
  });

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as BaseUser;
        setBaseUserState(parsed);
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setIsInitializing(false);
  }, []);

  // Merge base user with /me data
  const fullUser = useMemo<User | null>(() => {
    if (!baseUser || !meData?.data) return null;
    return {
      ...baseUser,
      tenantId: meData.data.tenantId,
      roles: meData.data.roles,
      permissions: meData.data.permissions,
      mustChangePassword: meData.data.mustChangePassword,
    };
  }, [baseUser, meData]);

  const setUser = (user: BaseUser | null) => {
    setBaseUserState(user);
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      mutateMe();
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
      setBaseUserState(null);
      router.push("/login");
    }
  };

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!fullUser?.permissions) return false;
      if (fullUser.permissions.includes("*")) return true;
      return fullUser.permissions.includes(permission);
    },
    [fullUser?.permissions],
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!fullUser?.roles) return false;
      return fullUser.roles.includes(role);
    },
    [fullUser?.roles],
  );

  const isAdmin = useMemo(() => {
    return fullUser?.roles?.includes("ADMIN") ?? false;
  }, [fullUser?.roles]);

  const isLoading = isInitializing || (!!baseUser && isMeLoading);
  const isAuthenticated = !!baseUser;

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user: fullUser,
      isLoading,
      isAuthenticated,
      setUser,
      logout,
      hasPermission,
      hasRole,
      isAdmin,
    }),
    [fullUser, isLoading, isAuthenticated, hasPermission, hasRole, isAdmin],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
