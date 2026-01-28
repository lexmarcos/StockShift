import useSWR from "swr";
import { useAuth } from "@/lib/contexts/auth-context";
import { api } from "@/lib/api";

interface UsersResponse {
  success: boolean;
  data: { isActive: boolean }[];
}

interface RolesResponse {
  success: boolean;
  data: unknown[];
}

export const useSystemModel = () => {
  const { isAdmin, isLoading: isLoadingAdmin } = useAuth();

  const { data: usersData, error: usersError, isLoading: isLoadingUsers } = useSWR<UsersResponse>(
    isAdmin ? "users" : null,
    async () => {
      return await api.get("users").json<UsersResponse>();
    }
  );

  const { data: rolesData, error: rolesError, isLoading: isLoadingRoles } = useSWR<RolesResponse>(
    isAdmin ? "roles" : null,
    async () => {
      return await api.get("roles").json<RolesResponse>();
    }
  );

  const isLoading = isLoadingAdmin || isLoadingUsers || isLoadingRoles;
  const error = usersError || rolesError || null;

  const activeUsersCount = usersData?.data?.filter((u) => u.isActive).length || 0;
  const rolesCount = rolesData?.data?.length || 0;

  return {
    activeUsersCount,
    rolesCount,
    isLoading,
    error,
    isAdmin,
    isLoadingAdmin,
  };
};
