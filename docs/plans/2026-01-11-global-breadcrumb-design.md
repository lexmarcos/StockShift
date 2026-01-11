# Design: Sistema Global de Breadcrumb

**Data**: 2026-01-11
**Status**: Aprovado
**Abordagem**: Context API + Hook Custom (Abordagem 1)

## 📋 Visão Geral

Implementar um sistema global de breadcrumb para navegação contextual em páginas de detalhes, substituindo headers individuais por um componente centralizado e reutilizável.

### Objetivo

Criar um breadcrumb sticky que:
- Aparece automaticamente em rotas com profundidade 2+ (ex: `/products/[id]`)
- Mostra botão voltar + caminho de navegação + título da entidade
- Segue o design "Corporate Solid Dark (Vivid)" do projeto
- Usa arquitetura MVVM consistente com o projeto

### Comportamento

```
/products           → breadcrumb NÃO aparece
/products/[id]      → breadcrumb APARECE
/batches            → breadcrumb NÃO aparece
/batches/[id]       → breadcrumb APARECE
/batches/[id]/edit  → breadcrumb APARECE
```

---

## 🏗️ Arquitetura

### Fluxo de Dados

```
page.tsx
    ↓
.model.ts → useBreadcrumb({ title, backUrl })
    ↓
BreadcrumbContext (estado global)
    ↓
<Breadcrumb /> no layout
    ↓
UI renderizada
```

### Camadas

1. **Context Layer**: `breadcrumb-context.tsx` - Gerencia estado global
2. **Hook Layer**: `use-breadcrumb.ts` - Interface para páginas
3. **View Layer**: `breadcrumb.tsx` - Componente visual

### Estrutura de Arquivos

```
components/breadcrumb/
  ├── breadcrumb.tsx              # Componente visual
  ├── breadcrumb-context.tsx      # Context + Provider
  └── use-breadcrumb.ts           # Hook custom
```

---

## 📐 Tipos TypeScript

### BreadcrumbData

```typescript
interface BreadcrumbData {
  title: string;           // Nome da entidade (obrigatório)
  backUrl: string;         // URL de retorno (obrigatório)
  section?: string;        // Seção principal (opcional, inferido)
  subsection?: string;     // Subseção (opcional, inferido)
}
```

### BreadcrumbContextValue

```typescript
interface BreadcrumbContextValue {
  breadcrumb: BreadcrumbData | null;
  setBreadcrumb: (data: BreadcrumbData) => void;
  clearBreadcrumb: () => void;
}
```

---

## 🔧 Implementação

### 1. BreadcrumbContext (`breadcrumb-context.tsx`)

**Responsabilidades**:
- Gerenciar estado global do breadcrumb
- Detectar mudanças de rota via `usePathname()`
- Limpar breadcrumb automaticamente em rotas de profundidade 1
- Inferir seções baseado em mapa de rotas

**Estado Inicial**:
```typescript
const [breadcrumb, setBreadcrumb] = useState<BreadcrumbData | null>(null);
```

**Lógica de Limpeza Automática**:
```typescript
useEffect(() => {
  const pathSegments = pathname.split('/').filter(Boolean);
  const depth = pathSegments.length;

  if (depth <= 1) {
    setBreadcrumb(null);
  }
}, [pathname]);
```

**Mapa de Inferência de Seções**:
```typescript
const ROUTE_SECTIONS = {
  products: { section: 'Inventário', subsection: 'Detalhes' },
  batches: { section: 'Inventário', subsection: 'Lote' },
  'stock-movements': { section: 'Movimentação', subsection: 'Detalhes' },
  warehouses: { section: 'Armazéns', subsection: 'Detalhes' },
  categories: { section: 'Configurações', subsection: 'Categoria' },
  brands: { section: 'Configurações', subsection: 'Marca' },
};
```

**Inferência Automática**:
- Se `section`/`subsection` não forem passados no hook, o Provider extrai o primeiro segmento da URL e busca no mapa
- Exemplo: `/products/123` → extrai `"products"` → retorna `{ section: 'Inventário', subsection: 'Detalhes' }`

### 2. Hook `useBreadcrumb` (`use-breadcrumb.ts`)

**Interface**:
```typescript
interface UseBreadcrumbParams {
  title: string;
  backUrl: string;
  section?: string;
  subsection?: string;
}

function useBreadcrumb(params: UseBreadcrumbParams): void
```

**Uso nas Páginas (Model)**:
```typescript
// products-detail.model.ts
export const useProductDetailModel = (productId: string) => {
  const { data: product, isLoading, error } = useSWR(/* ... */);

  useBreadcrumb({
    title: product?.name || 'Carregando...',
    backUrl: '/products',
  });

  return { product, isLoading, error };
};
```

**Comportamento**:
- **Registro Automático**: Ao montar, chama `setBreadcrumb()` do context
- **Atualização Reativa**: Se `title` mudar, breadcrumb atualiza automaticamente
- **Limpeza Automática**: Ao desmontar, chama `clearBreadcrumb()`

**Implementação Interna**:
```typescript
useEffect(() => {
  setBreadcrumb({
    title,
    backUrl,
    section: section || inferredSection,
    subsection: subsection || inferredSubsection,
  });

  return () => clearBreadcrumb();
}, [title, backUrl, section, subsection]);
```

### 3. Componente Visual `<Breadcrumb />` (`breadcrumb.tsx`)

**Estrutura Visual**:
```
┌─────────────────────────────────────────────────────────┐
│ [←] Inventário / Detalhes                               │
│     iPhone 13 Pro                                       │
└─────────────────────────────────────────────────────────┘
```

**Design System**:
- Background: `bg-[#0A0A0A]/95 backdrop-blur-sm`
- Borda: `border-b border-neutral-800`
- Altura: `h-16`
- Posicionamento: `sticky top-0 z-30`
- Container: `max-w-7xl mx-auto`

**⚠️ REGRA OBRIGATÓRIA - Compensação do Sidebar**:
```typescript
className="sticky top-0 z-30 ... md:ml-[240px]"
```
Toda div sticky full-width DEVE incluir `md:ml-[240px]` para compensar o sidebar de 240px.

**Responsividade**:
- Mobile: `px-4`
- Tablet: `md:px-6`
- Desktop: `lg:px-8`

**Renderização Condicional**:
```typescript
if (!breadcrumb) return null;
```
Só renderiza se existem dados no contexto.

**Estrutura JSX**:
```tsx
<header className="sticky top-0 z-30 border-b border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm md:ml-[240px]">
  <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
    <div className="flex items-center gap-4">
      <Link href={breadcrumb.backUrl}>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-[4px] border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            {breadcrumb.section}
          </span>
          <span className="text-[10px] text-neutral-700">/</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
            {breadcrumb.subsection}
          </span>
        </div>
        <h1 className="text-sm font-bold uppercase tracking-wide text-white mt-0.5">
          {breadcrumb.title}
        </h1>
      </div>
    </div>
  </div>
</header>
```

**Acessibilidade**:
```tsx
<nav aria-label="Breadcrumb">
  <Link href={breadcrumb.backUrl} aria-label="Voltar para lista">
    <ArrowLeft />
  </Link>
</nav>
```

---

## 🔌 Integração no Layout

### Modificação em `app/(pages)/layout.tsx`

```typescript
import { BreadcrumbProvider } from '@/components/breadcrumb/breadcrumb-context';
import { Breadcrumb } from '@/components/breadcrumb/breadcrumb';

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <BreadcrumbProvider>
      <div className="flex min-w-0 flex-1 flex-col md:ml-[var(--sidebar-width)]">
        <Header />
        <Breadcrumb />  {/* Novo componente */}
        {children}
      </div>
    </BreadcrumbProvider>
  );
}
```

**Posição**: Entre `<Header />` e `{children}`, garantindo que apareça acima do conteúdo.

---

## 🔄 Migração de Páginas Existentes

### Páginas Afetadas (Profundidade 2+)

- `/products/[id]` - Detalhes de Produto ✅ Tem header atualmente
- `/products/[id]/edit` - Edição de Produto
- `/batches/[id]` - Detalhes de Lote
- `/batches/[id]/edit` - Edição de Lote
- `/stock-movements/[id]` - Detalhes de Movimentação

### Exemplo: Products Detail

**ANTES** (`products-detail.view.tsx`):
```typescript
// ❌ REMOVER linhas 116-144
<header className="sticky top-0 z-30 border-b border-neutral-800 bg-[#0A0A0A]/95 backdrop-blur-sm">
  {/* ... header atual ... */}
</header>
```

**DEPOIS** (`products-detail.model.ts`):
```typescript
// ✅ ADICIONAR no model
export const useProductDetailModel = (productId: string) => {
  const { data: product, isLoading, error } = useSWR(/* ... */);

  useBreadcrumb({
    title: product?.name || 'Carregando...',
    backUrl: '/products',
  });

  return { product, isLoading, error };
};
```

### Tratamento de Estados Especiais

**Loading**:
```typescript
useBreadcrumb({
  title: product?.name || 'Carregando...',
  backUrl: '/products',
});
```

**Erro**:
```typescript
useBreadcrumb({
  title: error ? 'Produto não encontrado' : (product?.name || 'Carregando...'),
  backUrl: '/products',
});
```

**Páginas de Edição**:
```typescript
useBreadcrumb({
  title: product?.name || 'Carregando...',
  backUrl: `/products/${productId}`,
  section: 'Inventário',
  subsection: 'Edição', // Override
});
```

### Ordem de Migração

1. `/products/[id]` - Tem header existente, mais fácil validar
2. `/batches/[id]` - Similar ao products
3. Páginas de edição e outras rotas aninhadas

---

## ⚠️ Edge Cases

### 1. Navegação Rápida entre Rotas

**Cenário**: `/products/123` → `/batches/456` rapidamente

**Solução**: O último `useBreadcrumb()` vence. O cleanup do primeiro breadcrumb acontece automaticamente ao desmontar.

### 2. Erro ao Carregar Dados

**Cenário**: Produto não existe (404)

**Solução**: Breadcrumb mostra mensagem de erro mas mantém navegação funcional:
```typescript
title: error ? 'Produto não encontrado' : (product?.name || 'Carregando...')
```

### 3. Rotas Profundas (3+ níveis)

**Cenário**: `/stock-movements/[id]/edit` (profundidade 3)

**Solução**: Funciona normalmente. Detecção é `depth >= 2`.

### 4. Múltiplos Hooks na Mesma Página

**Cenário**: Chamar `useBreadcrumb()` duas vezes acidentalmente

**Solução**: O segundo sobrescreve o primeiro. Em DEV mode, adicionar warning no console.

---

## ✅ Testes Sugeridos (Manual)

1. ✅ Navegar de `/products` → `/products/123` → breadcrumb aparece
2. ✅ Clicar no botão voltar → retorna para `/products` → breadcrumb desaparece
3. ✅ Navegar entre `/products/123` e `/batches/456` → breadcrumb atualiza
4. ✅ Recarregar página em `/products/123` → breadcrumb aparece corretamente
5. ✅ Testar em mobile e desktop → responsividade funciona
6. ✅ Verificar compensação do sidebar em desktop (não sobrepõe)

---

## 🎯 Checklist de Implementação

### Fase 1: Criação da Infraestrutura
- [ ] Criar `components/breadcrumb/breadcrumb-context.tsx`
- [ ] Criar `components/breadcrumb/use-breadcrumb.ts`
- [ ] Criar `components/breadcrumb/breadcrumb.tsx`
- [ ] Integrar `BreadcrumbProvider` e `<Breadcrumb />` no layout

### Fase 2: Migração de Páginas
- [ ] Migrar `/products/[id]` (remover header, adicionar hook no model)
- [ ] Testar navegação e estados (loading, erro, sucesso)
- [ ] Migrar `/batches/[id]`
- [ ] Migrar `/stock-movements/[id]`
- [ ] Migrar páginas de edição (`/[id]/edit`)

### Fase 3: Validação
- [ ] Executar testes manuais (lista acima)
- [ ] Verificar responsividade em mobile/tablet/desktop
- [ ] Validar acessibilidade (ARIA labels, navegação por teclado)
- [ ] Verificar que sidebar não é sobreposto em desktop

---

## 📚 Referências

- Header atual de produtos: `app/(pages)/products/[id]/products-detail.view.tsx:116-144`
- Layout de páginas: `app/(pages)/layout.tsx`
- Context existente similar: `components/layout/mobile-menu-context.tsx`
- Guia de design: `CLAUDE.md` - Seção "Filosofia do Design"
