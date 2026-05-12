# Unified Sales KPI Cards Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Substituir os três cards individuais de métricas na tela de Vendas por um único contêiner unificado com divisórias internas automáticas, mantendo a estética de brutalismo escuro.

**Architecture:** Modificação direta da camada de View (`app/(pages)/sales/sales.view.tsx`), substituindo o uso do `InsightCard` isolado por uma nova estrutura flex/grid unificada com divisórias responsivas (`divide-y md:divide-y-0 md:divide-x divide-neutral-800`). Nenhuma alteração na modelógica ou nos contratos de dados é necessária.

**Tech Stack:** React, Next.js 15, Tailwind CSS, TypeScript.

---

### Task 1: Refatorar Cards de Métricas em sales.view.tsx

**Files:**
- Modify: `app/(pages)/sales/sales.view.tsx:669-700`

**Step 1: Implementar o novo bloco unificado de métricas**

Substituir o bloco de grid de `InsightCard` (linhas 669 a 700) pelo contêiner unificado de métricas com divisórias automáticas:

```tsx
            <div className="rounded-[4px] border border-neutral-800 bg-[#171717] overflow-hidden">
              {dashboardLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="size-6 animate-spin rounded-full border-2 border-neutral-500 border-t-blue-500" />
                </div>
              ) : (
                dashboardData && (
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
                    {/* Vendas */}
                    <div className="p-4 md:p-5 flex items-center gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-[4px] bg-blue-500/10 text-blue-400">
                        <ShoppingCart className="size-5" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Vendas
                        </div>
                        <div className="mt-0.5 flex items-baseline gap-1.5">
                          <span className="font-mono text-2xl font-bold tracking-tighter text-white">
                            {dashboardData.kpis[kpiPeriod].count}
                          </span>
                          <span className="text-xs text-neutral-500 font-sans font-normal">
                            vendas
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Faturamento */}
                    <div className="p-4 md:p-5 flex items-center gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-[4px] bg-emerald-500/10 text-emerald-400">
                        <DollarSign className="size-5" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Faturamento
                        </div>
                        <div className="mt-0.5">
                          <span className="font-mono text-2xl font-bold tracking-tighter text-white">
                            {formatCents(dashboardData.kpis[kpiPeriod].revenue)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ticket Médio */}
                    <div className="p-4 md:p-5 flex items-center gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-[4px] bg-amber-500/10 text-amber-400">
                        <TrendingUp className="size-5" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                          Ticket Médio
                        </div>
                        <div className="mt-0.5">
                          <span className="font-mono text-2xl font-bold tracking-tighter text-white">
                            {formatCents(dashboardData.kpis[kpiPeriod].avgTicket)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
```

**Step 2: Verificar integridade dos tipos e testes de regressão**

Run: `pnpm test app/(pages)/sales/sales.model.test.ts`
Expected: PASS com todos os testes passando com sucesso.

**Step 3: Commit**

```bash
git add app/(pages)/sales/sales.view.tsx
git commit -m "feat(sales): replace separate kpi cards with a unified responsive container"
```
