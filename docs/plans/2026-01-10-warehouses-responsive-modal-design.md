# Design: Modal Responsivo para Warehouses

**Data:** 2026-01-10  
**Autor:** Sistema  
**Status:** Implementado

## Objetivo

Melhorar a experiência mobile da página de warehouses transformando o modal de criar/editar em um drawer que desliza do bottom no mobile, mantendo o dialog tradicional no desktop.

## Contexto

A página de warehouses utiliza um modal (Dialog) para criar e editar armazéns. Em dispositivos móveis, modais centralizados ocupam muito espaço da tela e podem dificultar a visualização do formulário completo. Drawers que deslizam do bottom são mais naturais e otimizados para mobile.

## Requisitos

### Funcionais
- No mobile (< 768px): Modal deve aparecer como drawer deslizando do bottom
- No tablet/desktop (≥ 768px): Modal deve continuar como dialog centralizado
- Comportamento e validações devem permanecer idênticos
- Suporte completo a formulários com react-hook-form e Zod

### Não-Funcionais
- Zero mudanças na lógica de negócio
- Código reutilizável para outras páginas
- Consistente com o design system (shadcn/ui)
- Performance: detecção de breakpoint eficiente

## Solução Técnica

### Arquitetura

A solução utiliza um **componente wrapper** que detecta o tamanho da tela e renderiza o componente apropriado:

```
┌─────────────────────────────┐
│   ResponsiveModal (Wrapper) │
│                             │
│   ┌─────────────────┐       │
│   │ useMediaQuery   │       │
│   │ (min-width:768) │       │
│   └────────┬────────┘       │
│            │                │
│     ┌──────▼──────┐         │
│     │ isDesktop?  │         │
│     └──────┬──────┘         │
│            │                │
│      ┌─────┴─────┐          │
│      │           │          │
│  ┌───▼──┐   ┌───▼──┐       │
│  │Dialog│   │Drawer│       │
│  └──────┘   └──────┘       │
└─────────────────────────────┘
```

### Componentes Criados

#### 1. `hooks/use-media-query.ts`
Hook customizado para detectar mudanças no tamanho da tela.

**Características:**
- Usa `window.matchMedia()` API
- Suporte a listeners de eventos
- Compatibilidade com navegadores antigos
- Re-renderiza apenas quando o breakpoint muda

**API:**
```typescript
const isDesktop = useMediaQuery("(min-width: 768px)");
```

#### 2. `app/warehouses/components/responsive-modal.tsx`
Componente wrapper que renderiza Dialog ou Drawer baseado no breakpoint.

**Props:**
- `open: boolean` - Estado de abertura do modal
- `onOpenChange: (open: boolean) => void` - Callback de mudança de estado
- `title: string` - Título do modal
- `description: string` - Descrição do modal
- `children: ReactNode` - Conteúdo do formulário
- `footer?: ReactNode` - Botões de ação

**Comportamento:**
- Mobile: Renderiza `Drawer` com `direction="bottom"`
- Desktop: Renderiza `Dialog` centralizado
- Mantém estilos consistentes com o design system

### Integração

#### Antes (warehouses.view.tsx):
```tsx
<Dialog open={isModalOpen} onOpenChange={closeModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>...</DialogTitle>
      <DialogDescription>...</DialogDescription>
    </DialogHeader>
    <Form>...</Form>
    <DialogFooter>...</DialogFooter>
  </DialogContent>
</Dialog>
```

#### Depois (warehouses.view.tsx):
```tsx
<ResponsiveModal
  open={isModalOpen}
  onOpenChange={closeModal}
  title="Novo Armazém"
  description="Preencha os dados..."
  footer={<>Botões...</>}
>
  <Form id="warehouse-form">...</Form>
</ResponsiveModal>
```

**Mudanças:**
- Removido import de `Dialog` e componentes relacionados
- Adicionado import de `ResponsiveModal`
- Botões movidos para prop `footer`
- Adicionado `id="warehouse-form"` no form para permitir submit via botão externo

## Design System

### Estilos Mobile (Drawer)
- **Background:** `#171717` (neutral-900)
- **Bordas:** `#262626` (neutral-800)
- **Border Radius:** `4px` (apenas topo)
- **Max Height:** `90vh` (permite scroll interno)
- **Handle:** Barra cinza no topo para indicar que pode arrastar

### Estilos Desktop (Dialog)
- **Background:** `#171717` (neutral-900)
- **Bordas:** `#262626` (neutral-800)
- **Border Radius:** `4px`
- **Max Width:** `600px`
- **Centralizado** na tela

## Reutilização

O componente `ResponsiveModal` pode ser reutilizado em outras páginas:

```tsx
import { ResponsiveModal } from "@/app/warehouses/components/responsive-modal";

<ResponsiveModal
  open={open}
  onOpenChange={setOpen}
  title="Título"
  description="Descrição"
  footer={<>Botões</>}
>
  {/* Conteúdo */}
</ResponsiveModal>
```

**Nota:** Considerar mover para `components/ui/responsive-modal.tsx` se usado em múltiplas páginas.

## Testes Manuais

### Mobile (< 768px)
- [ ] Modal abre deslizando do bottom
- [ ] Handle de arraste visível no topo
- [ ] Scroll funciona dentro do drawer
- [ ] Fechar por arraste para baixo funciona
- [ ] Fechar por clique no overlay funciona
- [ ] Formulário submete corretamente

### Desktop (≥ 768px)
- [ ] Modal abre centralizado
- [ ] Fechar por ESC funciona
- [ ] Fechar por clique no overlay funciona
- [ ] Formulário submete corretamente

### Transição de Breakpoint
- [ ] Ao redimensionar janela, modal adapta corretamente
- [ ] Estado do formulário é preservado durante redimensionamento

## Benefícios

1. **UX Mobile Melhorada:** Drawers são mais naturais em dispositivos touch
2. **Mais Espaço Visual:** Drawer usa altura da tela de forma otimizada
3. **Consistência:** Mantém padrões de design mobile-first
4. **Reutilizável:** Pode ser aplicado em outras páginas facilmente
5. **Zero Breaking Changes:** Lógica de negócio permanece inalterada

## Próximos Passos

1. Monitorar feedback de usuários sobre a nova experiência mobile
2. Considerar aplicar o padrão em outras páginas (products, batches, etc.)
3. Mover componente para `components/ui/` se houver uso em múltiplas páginas
4. Adicionar testes automatizados para o hook `useMediaQuery`
