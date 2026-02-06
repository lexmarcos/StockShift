# Componentes

## Componentes UI

Usar prioritariamente `/components/ui`. Novos componentes devem usar:
- Tailwind CSS para estilização
- lucide-react para ícones (`strokeWidth={2}` ou `2.5`)

## Breadcrumb

### Quando Usar

| Tipo de Rota | Exemplo | Breadcrumb |
|--------------|---------|------------|
| Principal | `/products`, `/warehouses` | Não |
| Filha | `/products/create`, `/products/[id]/edit` | Sim |

### Implementação

No `page.tsx` da rota filha:

```typescript
import { useBreadcrumb } from "@/components/breadcrumb/use-breadcrumb";

export default function ProductCreatePage() {
  useBreadcrumb({
    title: "Novo Produto",
    backUrl: "/products",
    section: "Produtos",
    subsection: "Criar",
  });

  return <ProductCreateView />;
}
```

## Componentes Compostos

Componentes de alto nível que encapsulam os padrões visuais do design system. **SEMPRE** usar ao criar páginas.

### PageContainer
Wrapper de toda página. Encapsula background, padding e max-width.
```tsx
import { PageContainer } from "@/components/ui/page-container";
<PageContainer bottomPadding="fixed-bar">{/* conteúdo */}</PageContainer>
```
- `bottomPadding`: `"default"` (pb-20) | `"fixed-bar"` (pb-28, usar quando há FixedBottomBar)

### PageHeader
Header de página com título e ações.
```tsx
import { PageHeader } from "@/components/ui/page-header";
<PageHeader title="Produtos" subtitle="Gerenciamento" actions={<Button>NOVO</Button>} />
```

### InsightCard
Card de KPI/métrica com ícone, label e valor.
```tsx
import { InsightCard } from "@/components/ui/insight-card";
<InsightCard icon={Package} color="blue" label="Total" value={128} suffix="itens" />
```
- `color`: `"blue"` | `"emerald"` | `"amber"` | `"rose"`

### StatusCard
Card com `border-l-4` colorido por status.
```tsx
import { StatusCard } from "@/components/ui/status-card";
<StatusCard status="success" onClick={() => {}} className="p-4">
  <p className="text-sm text-white">Conteúdo</p>
</StatusCard>
```
- `status`: `"info"` | `"success"` | `"warning"` | `"error"` | `"neutral"`

### FormSection
Card de seção de formulário com ícone e título no header.
```tsx
import { FormSection } from "@/components/ui/form-section";
<FormSection icon={Package} iconColor="text-blue-400" title="Dados Gerais" description="Informações básicas">
  <Input />
</FormSection>
```

### EmptyState
Estado vazio com ícone, título, descrição e ação opcional.
```tsx
import { EmptyState } from "@/components/ui/empty-state";
<EmptyState icon={Package} title="Nenhum item" description="Comece adicionando." action={{ label: "NOVO", onClick: () => {} }} />
```

### LoadingState
Spinner de carregamento.
```tsx
import { LoadingState } from "@/components/ui/loading-state";
<LoadingState message="Carregando produtos..." />
```

### ErrorState
Estado de erro com botão de retry.
```tsx
import { ErrorState } from "@/components/ui/error-state";
<ErrorState title="Erro ao carregar" description="Tente novamente." onRetry={() => mutate()} />
```

### FixedBottomBar
Barra inferior fixa com offset automático do sidebar. Já inclui `md:ml-[var(--sidebar-width)]`.
```tsx
import { FixedBottomBar } from "@/components/ui/fixed-bottom-bar";
<FixedBottomBar>
  <div className="mx-auto flex max-w-7xl items-center justify-end gap-3">
    <Button>SALVAR</Button>
  </div>
</FixedBottomBar>
```

### SectionLabel
Label tiny uppercase para separar seções.
```tsx
import { SectionLabel } from "@/components/ui/section-label";
<SectionLabel icon={Info}>Informações Gerais</SectionLabel>
```

### Templates de Página

Consulte os templates em `.claude/templates/` como referência ao criar páginas:
- `list-page.template.tsx` - Listagem com KPIs, busca, tabela/cards
- `form-page.template.tsx` - Formulário com FormSections e FixedBottomBar
- `detail-page.template.tsx` - Detalhe com StatusCard e seções de informação

## Design Responsivo

### Ordem de Implementação

1. Mobile (padrão inicial)
2. Tablet (`md:`)
3. Desktop (`lg:`, `max-w-7xl`)

### Sidebar Fix

O sidebar tem 240px de largura. Toda div `fixed` com `left-0 right-0` deve compensar:

```tsx
// Correto
<div className="fixed bottom-0 left-0 right-0 md:ml-[240px]">

// Errado - sobrepõe o sidebar
<div className="fixed bottom-0 left-0 right-0">
```
