import { useAuth } from "@/lib/contexts/auth-context";

/**
 * Hook para verificar permissões inline.
 *
 * @example
 * const { can } = usePermission();
 * {can("products:create") && <Button>Novo</Button>}
 *
 * @example
 * const { can } = usePermission();
 * const canDelete = can("products:delete");
 */
export function usePermission() {
  const { hasPermission, hasRole, isAdmin } = useAuth();

  return {
    /** Verifica se o usuário possui a permissão */
    can: hasPermission,
    /** Verifica se o usuário possui a role */
    hasRole,
    /** Se o usuário é admin */
    isAdmin,
  };
}
