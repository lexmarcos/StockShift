# Sidebar Navigation (Route Group `(pages)`) Design

## Objetivo
Adicionar um menu lateral para navegação entre páginas internas (Products, Batches, Brands, Categories, Stock Movements), mantendo login fora do shell.

## Escopo
- Criar route group `app/(pages)/` com layout específico.
- Mover páginas internas para dentro do grupo sem alterar URLs.
- Sidebar fixa no desktop e drawer no mobile.
- Itens: Products, Batches, Brands, Categories, Stock Movements.

## Não-Escopo
- Alterar páginas de login.
- Adicionar animações.
- Alterar lógica de negócio das páginas.

## Direção Visual
- **Corporate Solid Dark**: tons de cinza e preto.
- Borda sutil, rounded-sm (4px).
- Sem sombras fortes, sem gradientes coloridos.
- Ícones Lucide outline e contraste em cinza claro.
- Estado ativo com contraste por tons de cinza e borda lateral discreta.

## Arquitetura / Roteamento
- Criar `app/(pages)/layout.tsx` como shell.
- Mover pastas internas:
  - `app/products` → `app/(pages)/products`
  - `app/batches` → `app/(pages)/batches`
  - `app/brands` → `app/(pages)/brands`
  - `app/categories` → `app/(pages)/categories`
  - `app/stock-movements` → `app/(pages)/stock-movements`
- Subrotas (create, [id], edit) seguem junto.
- Login permanece fora de `(pages)`.

## Comportamento
- Desktop: sidebar fixa à esquerda, conteúdo à direita.
- Mobile: botão “Menu” abre drawer à esquerda.
- Drawer fecha ao clicar em um item.
- Item ativo destacado via `usePathname()`.

## Componentização
- Criar componente reutilizável `components/layout/app-sidebar.tsx`.
- Reutilizar no desktop e no drawer.
- Controle de estado do drawer no layout.

## Layout
- Content wrapper com `max-w-7xl` (regra global).
- Sidebar largura fixa (ex.: 240px), padding compacto.
- Sem animações/transições.

## Testes
- Teste simples de renderização do sidebar e item ativo (opcional).
