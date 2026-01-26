# Design Plan: Dashboard "Corporate Solid Dark (Vivid)" Rebirth

Esta proposta visa transformar o dashboard atual em uma interface de alta performance e apelo visual extremo, seguindo a filosofia **Corporate Solid Dark**. O foco é na junção de UX (dados rápidos e acionáveis) com uma UI Brutalista-Moderna de alto contraste.

## 🎨 Conceito Visual: "The Command Deck"

O novo dashboard será tratado como um "Centro de Comando". Menos espaços vazios e mais **densidade de informação organizada**.

### Paleta Estratégica

- **Background:** `#0A0A0A` (Deep Black)
- **Primary:** Blue-600 (`#2563EB`) para ações e navegação
- **Success:** Emerald-500 (`#10B981`) para saúde do estoque e lucros
- **Warning:** Amber-400 (`#FBBF24`) para vencimentos próximos
- **Danger:** Rose-600 (`#E11D48`) para estoque zero ou falhas
- **Gray:** Neutral-900 (Background de cards) e Neutral-800 (Bordas)

### Geometria

- Bordas rigorosas em **4px**.
- Uso de `border-l-4` ou `border-t-4` com cores vivid para sinalizar contextos sem poluição textual.

---

## 🏗️ Estrutura e Grid (Mobile First)

A página será dividida em zonas de calor baseadas na importância dos dados.

### 1. Header & Quick Actions

- Título minimalista e botão de **Refresh** com animação abrupta (instantânea).
- Botão "Novo Movimento" em destaque (Vivid Blue).

### 2. KPI Hero Section (The Pulse)

- Cards menores, porém mais intensos.
- **KPIs:** Valor Total em Estoque, Itens Totais, Armazéns Ativos.
- Cada card terá um "Sparkline" (mini gráfico de tendência) se os dados permitirem, ou apenas indicadores de tendência (+/- %).

### 3. Critical Alerts (Zonas de Tensão)

- Duas colunas em desktop, empilhadas em mobile.
- **Estoque Baixo** (Rose Alert): Listagem rápida de itens críticos.
- **Vencimentos** (Amber Alert): Itens que precisam de saída urgente.

### 4. Data Visualization (The Insights)

- Gráficos ocupando maior área.
- **Movimentação Mensal:** Gráfico de Área (AreaChart) com preenchimento em gradiente sutil.
- **Distribuição por Categoria/Armazém:** Componentes `RadialBarChart` ou `BarChart` horizontais para melhor leitura em mobile.

### 5. Activity Feed (The Flow)

- Log de movimentações recentes no estilo "Timeline Técnica".
- Uso de fontes mono para IDs e valores para sensação de precisão.

---

## 🛠️ Detalhes de Implementação (UX/UI)

### Tipografia

- Números grandes em **Bold** com `tracking-tighter`.
- Rótulos em **Uppercase** com `tracking-widest` e tamanho `text-[10px]`.

### Interações

- **Hover:** Mudança instantânea de `neutral-800` para `neutral-700` no fundo dos cards.
- **Loading:** Skeletons que respeitam a geometria de 4px, mantendo a estrutura visual fixa para evitar "layout shift".

---

Ready to proceed with the technical documentation (Types, Model, and View)?
