"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/contexts/auth-context";

interface PermissionGateProps {
  /** Permissão necessária (ex: "products:create", "batches:delete") */
  permission: string;
  /** Conteúdo a ser renderizado se o usuário tiver permissão */
  children: ReactNode;
  /** Conteúdo alternativo se não tiver permissão (opcional) */
  fallback?: ReactNode;
}

/**
 * Componente que renderiza seus filhos apenas se o usuário
 * possuir a permissão especificada.
 *
 * @example
 * <PermissionGate permission="products:create">
 *   <Button>Novo Produto</Button>
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
