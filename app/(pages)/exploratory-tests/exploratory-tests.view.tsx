"use client";

import Link from "next/link";
import { ExternalLink, RotateCcw, CheckSquare, Square } from "lucide-react";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExploratoryTestsViewProps } from "./exploratory-tests.types";
import type { ExploratoryTest, ExploratoryTestCategory } from "./exploratory-tests.constants";

const PRIORITY_COLORS: Record<string, string> = {
  ALTA: "text-red-400 border-red-500/40",
  MÉDIA: "text-amber-400 border-amber-500/40",
  BAIXA: "text-neutral-400 border-neutral-500/40",
};

export function ExploratoryTestsView({
  tests,
  categories,
  completedTestIds,
  completedPercentage,
  testsByCategory,
  toggleTest,
  resetAll,
}: ExploratoryTestsViewProps) {
  const progressColor = completedPercentage === 100
    ? "text-green-400"
    : completedPercentage >= 50
      ? "text-amber-400"
      : "text-neutral-400";

  return (
    <PageContainer bottomPadding="default">
      <PageHeader
        title="Testes Exploratórios"
        subtitle="Branch indexdb"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={resetAll}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Resetar
          </Button>
        }
      />

      <div className="mb-8 flex items-center gap-4 rounded-sm border border-neutral-800 bg-[#171717] p-4">
        <div className={cn("text-3xl font-bold", progressColor)}>
          {completedPercentage}%
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Progresso dos testes</p>
          <p className="text-xs text-neutral-400">
            {completedTestIds.size} de {tests.length} testes concluídos
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-sm bg-neutral-800">
            <div
              className={cn("h-full rounded-sm transition-all duration-300", {
                "bg-green-500": completedPercentage === 100,
                "bg-amber-500": completedPercentage >= 50 && completedPercentage < 100,
                "bg-blue-500": completedPercentage > 0 && completedPercentage < 50,
                "bg-neutral-700": completedPercentage === 0,
              })}
              style={{ width: `${completedPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {categories.map((category) => (
          <CategorySection
            key={category.key}
            category={category}
            tests={testsByCategory.get(category.key) ?? []}
            completedTestIds={completedTestIds}
            toggleTest={toggleTest}
          />
        ))}
      </div>

      <div className="mt-10 text-center">
        <p className="text-xs text-neutral-600">
          O progresso é salvo automaticamente no navegador.
          Ao limpar os dados do site, o progresso será perdido.
        </p>
      </div>
    </PageContainer>
  );
}

function CategorySection({
  category,
  tests,
  completedTestIds,
  toggleTest,
}: {
  category: ExploratoryTestCategory;
  tests: ExploratoryTest[];
  completedTestIds: Set<string>;
  toggleTest: (testId: string) => void;
}) {
  const categoryCompleted = tests.filter((t) => completedTestIds.has(t.id)).length;
  const categoryTotal = tests.length;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cn(
            "rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
            PRIORITY_COLORS[category.priority],
          )}
        >
          {category.priority}
        </span>
        <h2 className="text-lg font-semibold text-white">{category.label}</h2>
        <span className="text-xs text-neutral-500">
          {categoryCompleted}/{categoryTotal}
        </span>
      </div>

      <div className="space-y-2">
        {tests.map((test) => (
          <TestCard
            key={test.id}
            test={test}
            isCompleted={completedTestIds.has(test.id)}
            onToggle={() => toggleTest(test.id)}
          />
        ))}
      </div>
    </section>
  );
}

function TestCard({
  test,
  isCompleted,
  onToggle,
}: {
  test: ExploratoryTest;
  isCompleted: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-sm border border-neutral-800 bg-[#171717] transition-colors",
        isCompleted && "border-green-500/30 bg-green-500/5",
      )}
    >
      <div className="flex items-start gap-3 p-3">
        <button
          type="button"
          onClick={onToggle}
          className="mt-0.5 flex-shrink-0 text-neutral-400 hover:text-white"
          aria-label={isCompleted ? "Desmarcar como concluído" : "Marcar como concluído"}
        >
          {isCompleted ? (
            <CheckSquare className="h-5 w-5 text-green-400" />
          ) : (
            <Square className="h-5 w-5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-sm font-semibold",
                isCompleted ? "text-green-300 line-through" : "text-white",
              )}
            >
              {test.title}
            </p>
            <Link
              href={test.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-1 rounded-sm border border-neutral-700 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400 hover:border-neutral-500 hover:text-white"
            >
              {test.pageLabel}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-neutral-400">
            {test.howToTest}
          </p>
        </div>
      </div>
    </div>
  );
}
