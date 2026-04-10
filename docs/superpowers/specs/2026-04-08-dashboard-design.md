# Dashboard — Design Spec

## Resumo

Tela de dashboard executivo na rota `/dashboard`, consumindo `GET /api/reports/dashboard`. Layout Grid Clássico com 4 seções: KPIs, gráficos, movimentações recentes e stats de movimentação.

## Arquitetura

- **Rota**: `app/(pages)/dashboard/page.tsx`
- **MVVM**:
  - `dashboard.types.ts` — interfaces da resposta da API
  - `dashboard.model.ts` — SWR hook para fetch do endpoint, states de loading/error
  - `dashboard.view.tsx` — JSX puro, recebe tudo via props
  - `page.tsx` — ViewModel que orquestra model e view

## Endpoint

`GET /api/reports/dashboard` — requer permissão `REPORT_READ` ou `ROLE_ADMIN`.

Retorna: `totalProducts`, `activeProducts`, `totalWarehouses`, `activeWarehouses`, `totalBatches`, `totalStockValue`, `lowStockCount`, `expiringCount`, `recentMovements[]`, `stockByWarehouse[]`, `stockByCategory[]`, `movementStats{today, thisWeek, thisMonth}`.

## Layout — Grid Clássico (topo para baixo)

### 1. PageHeader
- Título: "Dashboard"
- Subtítulo: "Visão Geral"

### 2. KPI Cards — 4x InsightCard
Grid 2x2 mobile, 4 colunas desktop:
| Card | Color | Label | Value | Suffix |
|------|-------|-------|-------|--------|
| Produtos Ativos | blue | "Produtos Ativos" | `activeProducts` | `de {totalProducts}` |
| Valor em Estoque | emerald | "Valor em Estoque" | `totalStockValue` formatado R$ | — |
| Estoque Baixo | amber | "Estoque Baixo" | `lowStockCount` | "alertas" |
| Expirando | rose | "Expirando" | `expiringCount` | "itens" |

### 3. Gráficos — Grid 2 colunas desktop, 1 coluna mobile
- **Barras verticais**: Valor de estoque por armazém (`stockByWarehouse[].stockValue` vs `stockByWarehouse[].warehouseName`)
- **Donut**: Distribuição por categoria (`stockByCategory[].stockValue` vs `stockByCategory[].categoryName`)

Usar Recharts via `ChartContainer` existente em `components/ui/chart.tsx`.

### 4. Seções Inferiores — Grid 2 colunas desktop, 1 coluna mobile

#### 4a. Movimentações Recentes — Timeline Vertical
- Cada item: ícone colorido por tipo (ArrowDownCircle verde=ENTRY, ArrowUpCircle vermelho=EXIT, ArrowLeftRight azul=TRANSFER, Wrench cinza=ADJUSTMENT)
- Informações: tipo, data formatada, contagem de produtos, notas
- Status badge (COMPLETED, PENDING, etc.)
- Máximo 5-10 itens recentes

#### 4b. Stats de Movimentação — Mini-cards em 3 colunas
Cada coluna (Hoje / Semana / Mês) contém 4 métricas:
- Entradas (verde)
- Saídas (vermelho)
- Transferências (azul)
- Ajustes (cinza)

Valores de `movementStats.today`, `movementStats.thisWeek`, `movementStats.thisMonth`.

## Responsividade

| Seção | Mobile | Tablet (md) | Desktop (lg) |
|-------|--------|-------------|--------------|
| KPIs | 2x2 grid | 4 colunas | 4 colunas |
| Gráficos | 1 coluna | 2 colunas | 2 colunas |
| Inferior | 1 coluna | 2 colunas | 2 colunas |

Container: `max-w-7xl mx-auto`.

## States

- **Loading**: Skeleton placeholders com mesmo layout
- **Error**: `ErrorState` com botão retry (mutate do SWR)
- **Empty/No data**: Mensagem informativa quando API retorna dados vazios

## Componentes Utilizados

- `PageContainer` — wrapper
- `PageHeader` — header
- `InsightCard` — KPI cards
- `StatusCard` — para timeline items (border-l-4)
- `SectionLabel` — separar seções
- `LoadingState` / `ErrorState` — states
- `ChartContainer` + Recharts — gráficos

## Formatação de Dados

- Valores monetários: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Datas: `date-fns` (`formatDistanceToNow` ou `format`)
- Números: separador de milhar pt-BR

## Arquivos a Criar

1. `app/(pages)/dashboard/dashboard.types.ts`
2. `app/(pages)/dashboard/dashboard.model.ts`
3. `app/(pages)/dashboard/dashboard.view.tsx`
4. `app/(pages)/dashboard/page.tsx`
