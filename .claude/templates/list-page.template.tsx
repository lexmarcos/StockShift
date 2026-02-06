/**
 * TEMPLATE: Página de Listagem
 *
 * Este arquivo é referência para agentes AI, NÃO é código executável.
 * Copie e adapte os padrões abaixo ao criar páginas de listagem.
 *
 * Estrutura: PageContainer + PageHeader + InsightCards + Filtros + Tabela/Cards + Paginação
 */

// ============================================================
// page.tsx (ViewModel)
// ============================================================

"use client";

import { useExampleModel } from "./example.model";
import { ExampleView } from "./example.view";

export default function ExamplePage() {
  const model = useExampleModel();
  return <ExampleView {...model} />;
}

// ============================================================
// example.types.ts
// ============================================================

export interface ExampleItem {
  id: string;
  name: string;
  status: "active" | "inactive";
}

export interface ExampleViewProps {
  items: ExampleItem[];
  isLoading: boolean;
  error: Error | null;
  totalItems: number;
  onRetry: () => void;
}

// ============================================================
// example.model.ts
// ============================================================

import useSWR from "swr";
import { api } from "@/lib/api";
// import type { ExampleItem, ExampleViewProps } from "./example.types";

// export function useExampleModel(): ExampleViewProps {
//   const { data, error, isLoading, mutate } = useSWR(
//     "/api/example",
//     (url: string) => api.get(url).json()
//   );
//
//   return {
//     items: data?.items ?? [],
//     isLoading,
//     error: error ?? null,
//     totalItems: data?.total ?? 0,
//     onRetry: () => mutate(),
//   };
// }

// ============================================================
// example.view.tsx (View)
// ============================================================

import { Package, Plus, Search, TrendingUp, AlertTriangle, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { InsightCard } from "@/components/ui/insight-card";
import { StatusCard } from "@/components/ui/status-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { SectionLabel } from "@/components/ui/section-label";
// import type { ExampleViewProps } from "./example.types";

function ExampleView(/* props: ExampleViewProps */) {
  return (
    <PageContainer>
      {/* Header com título e ação principal */}
      <PageHeader
        title="Itens"
        subtitle="Gerenciamento"
        actions={
          <Button className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            NOVO ITEM
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <InsightCard
          icon={Package}
          color="blue"
          label="Total"
          value={128}
        />
        <InsightCard
          icon={TrendingUp}
          color="emerald"
          label="Ativos"
          value={96}
        />
        <InsightCard
          icon={AlertTriangle}
          color="amber"
          label="Alertas"
          value={12}
        />
        <InsightCard
          icon={Box}
          color="rose"
          label="Inativos"
          value={20}
        />
      </div>

      {/* Busca e filtros */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            placeholder="Buscar..."
            className="h-10 rounded-[4px] border-neutral-800 bg-neutral-900 pl-10 text-sm"
          />
        </div>
      </div>

      <SectionLabel className="mb-4">Resultados</SectionLabel>

      {/* Estado de loading */}
      {/* {isLoading && <LoadingState />} */}

      {/* Estado de erro */}
      {/* {error && <ErrorState onRetry={onRetry} />} */}

      {/* Estado vazio */}
      {/* {!isLoading && !error && items.length === 0 && ( */}
      {/*   <EmptyState */}
      {/*     icon={Package} */}
      {/*     title="Nenhum item encontrado" */}
      {/*     description="Comece adicionando novos itens ao sistema." */}
      {/*     action={{ label: "NOVO ITEM", onClick: () => {} }} */}
      {/*   /> */}
      {/* )} */}

      {/* Lista mobile (cards) */}
      <div className="flex flex-col gap-3 md:hidden">
        <StatusCard status="success" className="p-4">
          <p className="text-sm font-bold text-white">Item de exemplo</p>
          <p className="text-xs text-neutral-500">Descrição breve</p>
        </StatusCard>
      </div>

      {/* Lista desktop (tabela) */}
      <div className="hidden md:block">
        <div className="rounded-[4px] border border-neutral-800 bg-[#171717]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-800 last:border-0">
                <td className="px-4 py-3 text-sm text-white">Item exemplo</td>
                <td className="px-4 py-3 text-sm text-emerald-400">Ativo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}

export { ExampleView };
