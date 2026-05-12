# Unified Sales KPI Cards Redesign

## Context & Motivation
A tela de `/sales` atualmente apresenta as métricas de resumo (Vendas, Faturamento e Ticket Médio) através de três instâncias isoladas do componente `InsightCard` dispostas em uma grelha. Para refinar o design estético e alinhá-lo com a nova referência visual solicitada pelo usuário, este documento especifica a unificação das três métricas dentro de um único contêiner brutalista escuro com divisórias internas sutis.

## Architectural & Design System Decisions
- **Subcomponente Interno:** Em vez de introduzir uma abstração prematura no sistema global de UI, as métricas serão renderizadas de forma limpa através de um subcomponente coeso no próprio arquivo `sales.view.tsx`.
- **Brutalismo Escuro:** Respeito absoluto às cores de superfície (`#171717`), bordas (`neutral-800`), e raio de borda fixo de `4px` sem sombras.
- **Responsividade Elegante:** Utilização das classes utilitárias `divide-y md:divide-y-0 md:divide-x divide-neutral-800` no contêiner principal para alternar de divisórias horizontais (mobile) para divisórias verticais (desktop) de maneira orgânica e automática.

## Visual Component Specifications

### Contêiner Externo
- **Classes:** `grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-800 rounded-[4px] border border-neutral-800 bg-[#171717]`

### Estrutura de cada Bloco (Vendas, Faturamento, Ticket Médio)
- **Layout Interno:** `p-4 md:p-5 flex items-center gap-4`
- **Caixas de Ícones:**
  - Base: `flex size-12 shrink-0 items-center justify-center rounded-[4px]`
  - Vendas: `bg-blue-500/10` | Ícone `ShoppingCart` com cor `text-blue-400`
  - Faturamento: `bg-emerald-500/10` | Ícone `DollarSign` com cor `text-emerald-400`
  - Ticket Médio: `bg-amber-500/10` | Ícone `TrendingUp` com cor `text-amber-400`
- **Tipografia dos Textos:**
  - Rótulo: `text-[10px] font-bold uppercase tracking-widest text-neutral-500`
  - Valor: `font-mono text-2xl font-bold tracking-tighter text-white`
  - Sufixo de quantidade: `<span className="text-xs text-neutral-500 font-sans font-normal ml-1.5">vendas</span>`
