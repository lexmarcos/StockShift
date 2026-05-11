"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CheckCircle2, Key, Lock, ShieldCheck } from "lucide-react";
import { Permission, Role } from "./roles.types";

interface RolePermissionsModalProps {
  open: boolean;
  role: Role | null;
  groupedPermissions: Map<string, Permission[]>;
  onClose: () => void;
}

export function RolePermissionsModal({
  open,
  role,
  groupedPermissions,
  onClose,
}: RolePermissionsModalProps) {
  const permissionCount = role?.permissions.length ?? 0;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title="Permissões da Role"
      description={role?.name ?? ""}
      maxWidth="sm:max-w-[680px]"
      footer={
        <Button
          variant="ghost"
          onClick={onClose}
          className="rounded-[4px] border-neutral-700 bg-transparent text-xs uppercase hover:bg-neutral-800 hover:text-white"
        >
          Fechar
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className={cn(
                    "size-4",
                    role?.isSystemRole ? "text-blue-500" : "text-neutral-500",
                  )}
                />
                <h2 className="truncate text-base font-semibold text-white">
                  {role?.name ?? "Role"}
                </h2>
              </div>
              {role?.description && (
                <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                  {role.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {role?.isSystemRole && (
                <Badge
                  variant="outline"
                  className="rounded-[2px] border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-500"
                >
                  <Lock className="mr-1 size-3" />
                  Sistema
                </Badge>
              )}
              <Badge
                variant="outline"
                className="rounded-[2px] border-neutral-700 bg-[#171717] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400"
              >
                {permissionCount} permissões
              </Badge>
            </div>
          </div>
        </div>

        {permissionCount === 0 ? (
          <div className="rounded-[4px] border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-500">
            Esta role não possui permissões vinculadas.
          </div>
        ) : (
          <ScrollArea className="max-h-[52vh] pr-3">
            <div className="space-y-3">
              {Array.from(groupedPermissions.entries()).map(
                ([resource, permissions]) => (
                  <section
                    key={resource}
                    className="rounded-[4px] border border-neutral-800 bg-neutral-900"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Key className="size-3.5 shrink-0 text-neutral-500" />
                        <h3 className="truncate text-xs font-semibold uppercase tracking-wide text-neutral-300">
                          {resource}
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className="rounded-[2px] border-neutral-700 bg-[#171717] px-1.5 py-0 text-[10px] font-bold text-neutral-500"
                      >
                        {permissions.length}
                      </Badge>
                    </div>
                    <div className="divide-y divide-neutral-800/70">
                      {permissions.map((permission) => (
                        <PermissionRow
                          key={permission.id}
                          permission={permission}
                        />
                      ))}
                    </div>
                  </section>
                ),
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </ResponsiveModal>
  );
}

function PermissionRow({ permission }: { permission: Permission }) {
  const action = permission.actionDisplayName || permission.action || "Ação";
  const scope = permission.scopeDisplayName || permission.scope || "Escopo";
  const code = permission.code || permission.description || permission.id;

  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-neutral-200">{action}</span>
          <span className="rounded-[2px] border border-neutral-800 bg-[#171717] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
            {scope}
          </span>
        </div>
        <p className="mt-1 break-all font-mono text-[11px] text-neutral-500">
          {code}
        </p>
      </div>
    </div>
  );
}
