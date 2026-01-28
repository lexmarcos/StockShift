"use client";

import Link from "next/link";
import { Users, Shield, ShieldAlert, ArrowRight } from "lucide-react";
import { SystemViewProps } from "./system.types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const SystemView = ({
  activeUsersCount,
  rolesCount,
  isLoading,
  isAdmin,
  isLoadingAdmin,
}: SystemViewProps) => {
  // Access denied state
  if (!isLoadingAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
        <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          <div className="flex h-96 w-full flex-col items-center justify-center gap-6 rounded-[4px] border border-rose-900/30 bg-rose-950/10">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-950/30 ring-1 ring-rose-900/50">
              <ShieldAlert className="h-8 w-8 text-rose-500" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold uppercase tracking-wide text-rose-500">
                Acesso Negado
              </h3>
              <p className="mt-1 max-w-xs text-xs text-rose-500/70">
                Você não tem permissão para acessar esta página.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans text-neutral-200">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wide text-white">
              Sistema
            </h1>
            <p className="mt-1 text-xs text-neutral-500">
              Gerencie usuários e permissões do sistema
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Users Card */}
            <Link
              href="/system/users"
              className={cn(
                "group relative flex flex-col gap-4 rounded-[4px] border border-neutral-800 bg-[#171717] p-6",
                "transition-all hover:border-blue-600/50 hover:shadow-[0_0_30px_-10px_rgba(37,99,235,0.3)]"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-[4px] bg-blue-600/10 ring-1 ring-blue-600/20">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <ArrowRight className="h-5 w-5 text-neutral-600 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                  Usuários
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Gerencie os usuários e suas permissões
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                {isLoading ? (
                  <Skeleton className="h-8 w-12 bg-neutral-800" />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {activeUsersCount}
                  </span>
                )}
                <span className="text-xs text-neutral-500">usuários ativos</span>
              </div>
            </Link>

            {/* Roles Card */}
            <Link
              href="/system/roles"
              className={cn(
                "group relative flex flex-col gap-4 rounded-[4px] border border-neutral-800 bg-[#171717] p-6",
                "transition-all hover:border-blue-600/50 hover:shadow-[0_0_30px_-10px_rgba(37,99,235,0.3)]"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-[4px] bg-emerald-600/10 ring-1 ring-emerald-600/20">
                  <Shield className="h-6 w-6 text-emerald-500" />
                </div>
                <ArrowRight className="h-5 w-5 text-neutral-600 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wide text-white">
                  Roles
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Gerencie as roles e permissões do sistema
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                {isLoading ? (
                  <Skeleton className="h-8 w-12 bg-neutral-800" />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {rolesCount}
                  </span>
                )}
                <span className="text-xs text-neutral-500">roles cadastradas</span>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
