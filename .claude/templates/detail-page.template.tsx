/**
 * TEMPLATE: Página de Detalhe
 *
 * Este arquivo é referência para agentes AI, NÃO é código executável.
 * Copie e adapte os padrões abaixo ao criar páginas de detalhe/visualização.
 *
 * Estrutura: PageContainer + PageHeader(com backLink) + StatusCard + SectionLabels + Info grids
 */

// ============================================================
// page.tsx (ViewModel) — rota filha, usa useBreadcrumb
// ============================================================

"use client";

import { useBreadcrumb } from "@/components/breadcrumb/use-breadcrumb";
import { useExampleDetailModel } from "./example-detail.model";
import { ExampleDetailView } from "./example-detail.view";

export default function ExampleDetailPage() {
  useBreadcrumb({
    title: "Detalhes do Item",
    backUrl: "/items",
    section: "Itens",
    subsection: "Detalhes",
  });

  const model = useExampleDetailModel();
  return <ExampleDetailView {...model} />;
}

// ============================================================
// example-detail.types.ts
// ============================================================

export interface ExampleDetailItem {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "pending";
  createdAt: string;
  category: string;
  quantity: number;
}

export interface ExampleDetailViewProps {
  item: ExampleDetailItem | null;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

// ============================================================
// example-detail.model.ts
// ============================================================

// import { useParams } from "next/navigation";
// import useSWR from "swr";
// import { api } from "@/lib/api";
// import type { ExampleDetailViewProps } from "./example-detail.types";
//
// export function useExampleDetailModel(): ExampleDetailViewProps {
//   const { id } = useParams();
//   const { data, error, isLoading, mutate } = useSWR(
//     `/api/example/${id}`,
//     (url: string) => api.get(url).json()
//   );
//
//   return {
//     item: data ?? null,
//     isLoading,
//     error: error ?? null,
//     onRetry: () => mutate(),
//   };
// }

// ============================================================
// example-detail.view.tsx (View)
// ============================================================

import {
  Package,
  Edit,
  Info,
  Clock,
  Tag,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatusCard } from "@/components/ui/status-card";
import { SectionLabel } from "@/components/ui/section-label";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
// import type { ExampleDetailViewProps } from "./example-detail.types";

function ExampleDetailView(/* props: ExampleDetailViewProps */) {
  // if (isLoading) return <PageContainer><LoadingState /></PageContainer>;
  // if (error) return <PageContainer><ErrorState onRetry={onRetry} /></PageContainer>;
  // if (!item) return null;

  return (
    <PageContainer>
      {/* Header com ação de editar */}
      <PageHeader
        title="Item de Exemplo"
        subtitle="Detalhes"
        actions={
          <Button className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700">
            <Edit className="mr-2 h-4 w-4" />
            EDITAR
          </Button>
        }
      />

      {/* Card de status principal */}
      <StatusCard status="success" className="mb-8 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-emerald-400" strokeWidth={2} />
            <div>
              <p className="text-sm font-bold text-white">Ativo</p>
              <p className="text-xs text-neutral-500">
                Criado em 01/01/2025
              </p>
            </div>
          </div>
          <span className="font-mono text-xl font-bold tracking-tighter text-white">
            128
          </span>
        </div>
      </StatusCard>

      {/* Seção: Informações Gerais */}
      <SectionLabel icon={Info} className="mb-4">
        Informações Gerais
      </SectionLabel>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Nome
          </p>
          <p className="mt-1 text-sm font-bold text-white">Item de Exemplo</p>
        </div>
        <div className="rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Categoria
          </p>
          <p className="mt-1 text-sm font-bold text-white">Eletrônicos</p>
        </div>
        <div className="rounded-[4px] border border-neutral-800 bg-[#171717] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Quantidade
          </p>
          <p className="mt-1 font-mono text-sm font-bold tracking-tighter text-white">
            128
          </p>
        </div>
      </div>

      {/* Seção: Histórico */}
      <SectionLabel icon={Clock} className="mb-4">
        Histórico
      </SectionLabel>
      <div className="space-y-3">
        <StatusCard status="info" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Atualização de estoque</p>
              <p className="text-xs text-neutral-500">01/01/2025 às 14:30</p>
            </div>
            <span className="font-mono text-sm font-bold tracking-tighter text-blue-400">
              +50
            </span>
          </div>
        </StatusCard>
        <StatusCard status="warning" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Saída de estoque</p>
              <p className="text-xs text-neutral-500">28/12/2024 às 09:15</p>
            </div>
            <span className="font-mono text-sm font-bold tracking-tighter text-amber-400">
              -20
            </span>
          </div>
        </StatusCard>
      </div>
    </PageContainer>
  );
}

export { ExampleDetailView };
