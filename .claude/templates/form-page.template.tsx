/**
 * TEMPLATE: Página de Formulário
 *
 * Este arquivo é referência para agentes AI, NÃO é código executável.
 * Copie e adapte os padrões abaixo ao criar páginas de formulário.
 *
 * Estrutura: PageContainer(fixed-bar) + Form + FormSections em grid + FixedBottomBar
 */

// ============================================================
// page.tsx (ViewModel) — rota filha, usa useBreadcrumb
// ============================================================

"use client";

import { useBreadcrumb } from "@/components/breadcrumb/use-breadcrumb";
import { useExampleCreateModel } from "./example-create.model";
import { ExampleCreateView } from "./example-create.view";

export default function ExampleCreatePage() {
  useBreadcrumb({
    title: "Novo Item",
    backUrl: "/items",
    section: "Itens",
    subsection: "Criar",
  });

  const model = useExampleCreateModel();
  return <ExampleCreateView {...model} />;
}

// ============================================================
// example-create.types.ts
// ============================================================

export interface ExampleCreateViewProps {
  onSubmit: (data: ExampleFormData) => void;
  isSubmitting: boolean;
}

export interface ExampleFormData {
  name: string;
  description: string;
  category: string;
}

// ============================================================
// example-create.schema.ts
// ============================================================

// import { z } from "zod";
//
// export const exampleCreateSchema = z.object({
//   name: z.string().min(1, "Nome é obrigatório"),
//   description: z.string().optional(),
//   category: z.string().min(1, "Categoria é obrigatória"),
// });

// ============================================================
// example-create.model.ts
// ============================================================

// import { useState } from "react";
// import { api } from "@/lib/api";
// import type { ExampleCreateViewProps, ExampleFormData } from "./example-create.types";
//
// export function useExampleCreateModel(): ExampleCreateViewProps {
//   const [isSubmitting, setIsSubmitting] = useState(false);
//
//   async function onSubmit(data: ExampleFormData) {
//     setIsSubmitting(true);
//     try {
//       await api.post("/api/example", { json: data }).json();
//     } finally {
//       setIsSubmitting(false);
//     }
//   }
//
//   return { onSubmit, isSubmitting };
// }

// ============================================================
// example-create.view.tsx (View)
// ============================================================

import { Package, Settings, FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { FormSection } from "@/components/ui/form-section";
import { FixedBottomBar } from "@/components/ui/fixed-bottom-bar";
// import type { ExampleCreateViewProps } from "./example-create.types";

function ExampleCreateView(/* props: ExampleCreateViewProps */) {
  return (
    <PageContainer bottomPadding="fixed-bar">
      <PageHeader
        title="Novo Item"
        subtitle="Cadastro"
      />

      <form className="grid gap-6 lg:grid-cols-3">
        {/* Coluna principal (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          <FormSection
            icon={Package}
            iconColor="text-blue-400"
            title="Informações Gerais"
            description="Dados básicos do item"
          >
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-400">
                Nome
              </Label>
              <Input
                placeholder="Nome do item"
                className="h-10 rounded-[4px] border-2 border-neutral-800 bg-neutral-900 focus:border-blue-600"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-400">
                Descrição
              </Label>
              <Textarea
                placeholder="Descrição detalhada"
                className="min-h-[100px] rounded-[4px] border-2 border-neutral-800 bg-neutral-900 focus:border-blue-600"
              />
            </div>
          </FormSection>

          <FormSection
            icon={FileText}
            iconColor="text-emerald-400"
            title="Detalhes"
          >
            <div className="space-y-2">
              <Label className="text-xs font-bold text-neutral-400">
                Categoria
              </Label>
              <Input
                placeholder="Ex: Eletrônicos"
                className="h-10 rounded-[4px] border-2 border-neutral-800 bg-neutral-900 focus:border-blue-600"
              />
            </div>
          </FormSection>
        </div>

        {/* Coluna lateral (1/3) */}
        <div className="space-y-6">
          <FormSection
            icon={Settings}
            iconColor="text-amber-400"
            title="Configurações"
          >
            <p className="text-xs text-neutral-500">
              Configurações adicionais do item.
            </p>
          </FormSection>
        </div>
      </form>

      {/* Barra inferior fixa com ações */}
      <FixedBottomBar>
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-3">
          <Button
            variant="outline"
            className="h-10 rounded-[4px] border-neutral-800 text-xs font-bold uppercase tracking-wide"
          >
            CANCELAR
          </Button>
          <Button className="h-10 rounded-[4px] bg-blue-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700">
            <Save className="mr-2 h-4 w-4" />
            SALVAR
          </Button>
        </div>
      </FixedBottomBar>
    </PageContainer>
  );
}

export { ExampleCreateView };
