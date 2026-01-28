export interface SystemViewProps {
  activeUsersCount: number;
  rolesCount: number;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isLoadingAdmin: boolean;
}
