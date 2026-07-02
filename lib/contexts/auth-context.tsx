"use client";

import {
  createContext,
  use,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { api } from "@/lib/api";
import { isPublicPath as matchesPublicPath } from "@/lib/auth/public-paths";

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

const createUserFromMeResponse = (meData: MeResponse): User => ({
  userId: meData.data.id,
  email: meData.data.email,
  fullName: meData.data.fullName,
  tenantId: meData.data.tenantId,
  roles: meData.data.roles,
  permissions: meData.data.permissions,
  mustChangePassword: meData.data.mustChangePassword,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [baseUser, setBaseUserState] = useState<BaseUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { push } = useRouter();
  const pathname = usePathname();
  const { mutate: clearSwrCache } = useSWRConfig();

  const isPublicPath = matchesPublicPath(pathname);
  const shouldFetchMe = !isInitializing && !isPublicPath;

  // Fetch complete user data with roles/permissions
  const {
    data: meData,
    isLoading: isMeLoading,
    mutate: mutateMe,
  } = useSWR<MeResponse>(shouldFetchMe ? "auth/me" : null, fetcher, {
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

  // Remove legacy plaintext user data from localStorage.
  useEffect(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setIsInitializing(false);
  }, []);

  const fullUser = useMemo<User | null>(() => {
    if (!meData?.data) return null;
    return createUserFromMeResponse(meData);
  }, [meData]);

  const setUser = useCallback((user: BaseUser | null) => {
    setBaseUserState(user);
    localStorage.removeItem(USER_STORAGE_KEY);
    if (user) {
      // Descarta qualquer /me em cache de uma sessão anterior antes de navegar
      // para uma rota protegida, evitando expor os dados do usuário anterior.
      clearSwrCache("auth/me", undefined, { revalidate: false });
      mutateMe();
    }
  }, [mutateMe, clearSwrCache]);

  const logout = useCallback(async () => {
    try {
      await api.post("auth/logout");
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(WAREHOUSE_STORAGE_KEY);
      sessionStorage.removeItem(WAREHOUSE_STORAGE_KEY);
      setBaseUserState(null);
      // Limpa todo o cache do SWR para não vazar dados do usuário anterior
      // (roles/permissions/nome) para o próximo login no mesmo tab.
      await clearSwrCache(() => true, undefined, { revalidate: false });
      push("/login");
    }
  }, [push, clearSwrCache]);

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

  const isLoading = isInitializing || (!isPublicPath && isMeLoading);
  const isAuthenticated = !!baseUser || !!meData?.data;

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
    [
      fullUser,
      isLoading,
      isAuthenticated,
      setUser,
      logout,
      hasPermission,
      hasRole,
      isAdmin,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = use(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
