# Stock Movements Mobile Wizard - Design

**Data**: 2026-01-20
**Tipo**: Design de Feature
**Escopo**: Wizard mobile-first para criação de movimentações de estoque (foco em transferências)

---

## Contexto e Requisitos

### Cenário de Uso
- **Usuário**: Funcionário de almoxarifado, em pé, operando com uma mão
- **Operação principal**: Transferências entre armazéns
- **Volume**: 5+ produtos por operação
- **Armazém de origem**: Varia (seleção manual necessária)
- **Input**: Scanner de código de barras + digitação manual como fallback
- **Seleção de lotes**: Manual (funcionário sabe de qual prateleira está pegando)
- **Fluxo**: Modo contínuo (adicionar item após item sem voltar para lista)

### Princípios de UX
1. **Touch-friendly**: Botões mínimo 56px de altura
2. **Alcance do polegar**: Ações principais sempre no bottom
3. **Contexto persistente**: Origem/destino sempre visíveis
4. **Modo contínuo**: Fluxo otimizado para adicionar múltiplos itens
5. **Feedback imediato**: Confirmação visual a cada ação

---

## Arquitetura

### Estrutura de Pastas

```
app/(pages)/stock-movements/create/
├── page.tsx                              # ViewModel
├── stock-movements-create.model.ts       # Lógica do wizard (atualizar)
├── stock-movements-create.view.tsx       # View principal (refatorar)
├── stock-movements-create.schema.ts      # Schemas Zod
├── stock-movements-create.types.ts       # Types
└── _components/
    ├── mobile-wizard-header.tsx          # Header com título e voltar
    ├── warehouse-context-bar.tsx         # Barra origem → destino
    ├── setup-phase.tsx                   # Fase 1: Seleção de armazéns
    ├── warehouse-bottom-sheet.tsx        # Bottom sheet para selecionar armazém
    ├── addition-phase.tsx                # Fase 2: Loop de adição
    ├── product-search-input.tsx          # Input de busca de produtos
    ├── barcode-scanner-button.tsx        # Botão de scanner
    ├── add-item-sheet.tsx                # Sheet para lote + quantidade
    ├── item-card.tsx                     # Card de item adicionado
    ├── quantity-stepper.tsx              # Stepper grande (-/+/input)
    ├── review-phase.tsx                  # Fase 3: Revisão final
    ├── success-screen.tsx                # Tela de sucesso
    └── mobile-footer-actions.tsx         # Footer fixo com ações
```

### Estado do Wizard

```typescript
type WizardPhase = 'setup' | 'addition' | 'review' | 'success';

interface MobileWizardState {
  phase: WizardPhase;

  // Setup
  sourceWarehouseId: string | null;
  destinationWarehouseId: string | null;

  // Addition
  items: MovementItem[];
  isAddingItem: boolean;
  currentProduct: Product | null;
  currentBatchId: string | null;
  currentQuantity: number;

  // Review
  executeNow: boolean;

  // Success
  createdMovementId: string | null;
  createdMovementCode: string | null;
}

interface MovementItem {
  id: string;           // ID local para UI
  productId: string;
  productName: string;
  productSku?: string;
  batchId: string;
  batchCode: string;
  quantity: number;
  maxQuantity: number;  // Disponível no lote
}
```

---

## Fases do Wizard

### Fase 1: Setup (Seleção de Armazéns)

**Layout:**

```
┌─────────────────────────────────────┐
│  ←  NOVA TRANSFERÊNCIA              │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │  📦  ORIGEM                 │    │
│  │                             │    │
│  │  Selecione o armazém...  ▼  │    │
│  └─────────────────────────────┘    │
│                                     │
│              ↓                      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🏭  DESTINO                │    │
│  │                             │    │
│  │  Selecione o armazém...  ▼  │    │
│  └─────────────────────────────┘    │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [       CONTINUAR →           ]    │
│                                     │
└─────────────────────────────────────┘
```

**Comportamento:**

| Elemento | Especificação |
|----------|---------------|
| Cards de armazém | Altura 100px, borda 1px neutral-800, toque abre bottom sheet |
| Card selecionado | Borda 2px blue-600, fundo blue-500/5 |
| Card de destino | Desabilitado (opacity-50) até origem ser selecionada |
| Seta conectora | Ícone ArrowDown, neutral-600, centralizado |
| Botão Continuar | Altura 56px, full-width, blue-600, disabled até ambos selecionados |
| Validação | Não permite origem = destino (erro inline no card destino) |

**Bottom Sheet de Armazéns:**

```
┌─────────────────────────────────────┐
│              ─────                  │  ← Handle
│  SELECIONAR ORIGEM                  │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │  🔍  Buscar armazém...      │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Armazém Central         ✓  │    │
│  │  234 produtos em estoque    │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  Armazém Norte              │    │
│  │  89 produtos em estoque     │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  Armazém Sul                │    │
│  │  156 produtos em estoque    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Especificações do Bottom Sheet:**

- Componente: shadcn Drawer (direction="bottom")
- Altura máxima: 70vh
- Lista scrollável
- Input de busca com filtro client-side
- Item height: 64px
- Fecha ao selecionar

---

### Fase 2: Adição Contínua (Loop de Itens)

**Layout Principal:**

```
┌─────────────────────────────────────┐
│  ←  TRANSFERÊNCIA                   │
├─────────────────────────────────────┤
│  Central  →  Norte                  │  ← Contexto compacto
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🔍  Buscar produto...      │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─── ITENS ADICIONADOS (3) ───      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Monitor 24" LG          ×  │    │
│  │  Lote: LT-2024-001          │    │
│  │  QTD: 5                 ✎   │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  Teclado Mecânico        ×  │    │
│  │  Lote: LT-2024-003          │    │
│  │  QTD: 12                ✎   │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  Mouse Wireless          ×  │    │
│  │  Lote: LT-2024-007          │    │
│  │  QTD: 8                 ✎   │    │
│  └─────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│  ████████████░░░░░░░░  3 itens      │
│                                     │
│  [📷 SCAN]        [FINALIZAR →]     │
└─────────────────────────────────────┘
```

**Especificações:**

| Elemento | Especificação |
|----------|---------------|
| Barra de contexto | Altura 40px, fundo neutral-900, texto "Origem → Destino" |
| Input de busca | Altura 48px, ícone Search à esquerda, placeholder "Buscar produto..." |
| Seção de itens | Título uppercase, neutral-500, contador entre parênteses |
| Cards de itens | Borda-l-4 blue-600, fundo neutral-900, altura auto |
| Botão remover (×) | Posição absolute top-right, 32x32px, hover rose-500 |
| Botão editar (✎) | Inline com quantidade, 32x32px, hover blue-500 |
| Progress bar | Altura 4px, blue-600, proporcional a quantidade de itens |
| Footer | Altura 120px, 2 botões 50/50 largura, gap-3 |
| Botão Scan | Altura 56px, neutral-800, ícone Camera |
| Botão Finalizar | Altura 56px, blue-600, só ativa com ≥1 item |

**Estado Vazio:**

```
┌─────────────────────────────────────┐
│                                     │
│              📦                     │
│                                     │
│     Nenhum item adicionado          │
│                                     │
│   Escaneie ou busque produtos       │
│   para adicionar à transferência    │
│                                     │
└─────────────────────────────────────┘
```

**Sheet de Adicionar Item (após scan ou seleção de busca):**

```
┌─────────────────────────────────────┐
│              ─────                  │
│  ADICIONAR ITEM                     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │         📦                  │    │
│  │    Monitor 24" LG           │    │
│  │    SKU: MON-LG-24           │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─── SELECIONAR LOTE ───            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  ○  LT-2024-001             │    │
│  │     Disp: 45   Val: 15/Mar  │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  ●  LT-2024-003          ✓  │    │
│  │     Disp: 120  Val: 22/Abr  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─── QUANTIDADE ───                 │
│                                     │
│    [ - ]     [ 12 ]     [ + ]       │
│              Máx: 120               │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [    ADICIONAR E PRÓXIMO     ]     │
│                                     │
│       Adicionar e finalizar         │
│                                     │
└─────────────────────────────────────┘
```

**Especificações do Sheet:**

| Elemento | Especificação |
|----------|---------------|
| Altura | 85vh (quase fullscreen) |
| Card do produto | Centralizado, fundo neutral-800, border-radius 4px |
| Lista de lotes | Radio buttons visuais, altura 64px cada |
| Lote selecionado | Borda blue-600, fundo blue-500/5, check icon |
| Lote sem estoque | Disabled, opacity-50, texto "Sem estoque" |
| Stepper quantidade | Botões 56x56px, input central 80px, font-mono text-2xl |
| Botão - | neutral-800, disabled se quantity = 1 |
| Botão + | neutral-800, disabled se quantity = maxQuantity |
| Texto Máx | neutral-500, text-xs, abaixo do stepper |
| Botão principal | 56px, blue-600, uppercase, tracking-wide |
| Link secundário | text-sm, neutral-400, underline on hover |

**Fluxo de Adição:**

```
[Scan/Busca]
    ↓
[Identifica produto]
    ↓
[Abre Sheet] → [Seleciona lote] → [Define quantidade]
    ↓
[Adicionar e Próximo] → [Fecha sheet, volta para tela principal]
                         [Foco no input de busca]
                         [Toast: "Item adicionado"]
    ou
[Adicionar e Finalizar] → [Adiciona item]
                          [Vai para Fase 3: Revisão]
```

**Scanner de Código de Barras:**

- Abre câmera em fullscreen
- Usa componente existente `BarcodeScannerModal`
- Após leitura bem-sucedida:
  1. Busca produto pelo código
  2. Se encontrado: abre Sheet de Adicionar Item
  3. Se não encontrado: Toast de erro + mantém câmera aberta

---

### Fase 3: Revisão e Confirmação

**Layout:**

```
┌─────────────────────────────────────┐
│  ←  REVISAR TRANSFERÊNCIA           │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │  ROTA                    ✎  │    │
│  │  ─────────────────────────  │    │
│  │  📦  Armazém Central        │    │
│  │          ↓                  │    │
│  │  🏭  Armazém Norte          │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  ITENS (7)               ✎  │    │
│  │  ─────────────────────────  │    │
│  │  Monitor 24" LG        × 5  │    │
│  │  Teclado Mecânico     × 12  │    │
│  │  Mouse Wireless        × 8  │    │
│  │  Webcam HD            × 20  │    │
│  │  Headset USB           × 6  │    │
│  │  ... +2 itens               │    │
│  │  ─────────────────────────  │    │
│  │  TOTAL: 58 unidades         │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  ☐  Executar agora          │    │
│  │     Atualiza o estoque      │    │
│  │     imediatamente           │    │
│  └─────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [   CONFIRMAR TRANSFERÊNCIA   ]    │
│                                     │
└─────────────────────────────────────┘
```

**Especificações:**

| Elemento | Especificação |
|----------|---------------|
| Cards de seção | Fundo neutral-900, borda neutral-800, padding 16px |
| Botão editar (✎) | Posição top-right, volta para fase correspondente |
| Lista de itens | Máximo 5 visíveis, "+N itens" expansível |
| Linha de total | Border-top, font-bold, text-white |
| Toggle execução | Checkbox estilizado, label + descrição |
| Descrição toggle | text-xs, neutral-500 |
| Botão confirmar | 56px, emerald-600, uppercase |

**Comportamento do Toggle "Executar agora":**

- **Desmarcado (padrão)**: Cria como PENDENTE, pode ser executada depois
- **Marcado**: Cria E executa imediatamente, estoque atualizado na hora

---

### Tela de Sucesso

**Layout:**

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│               ✓                     │
│                                     │
│     TRANSFERÊNCIA CRIADA            │
│                                     │
│         #MOV-2024-0847              │
│                                     │
│          58 unidades                │
│       Central → Norte               │
│                                     │
│    ┌───────────────────┐            │
│    │     PENDENTE      │            │
│    └───────────────────┘            │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [   NOVA TRANSFERÊNCIA    ]        │
│                                     │
│        Ver detalhes                 │
│                                     │
└─────────────────────────────────────┘
```

**Especificações:**

| Elemento | Especificação |
|----------|---------------|
| Ícone check | 64px, emerald-500, animação scale-in |
| Título | text-xl, font-bold, uppercase, white |
| Código | font-mono, text-lg, neutral-300 |
| Resumo | text-sm, neutral-400 |
| Badge status | PENDENTE = amber-500, EXECUTADA = emerald-500 |
| Botão principal | 56px, blue-600, reinicia wizard |
| Link secundário | text-sm, neutral-400, navega para detalhes |

---

## Componentes Reutilizáveis

### MobileWizardHeader

```tsx
interface MobileWizardHeaderProps {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
}
```

### WarehouseContextBar

```tsx
interface WarehouseContextBarProps {
  sourceWarehouse: string;
  destinationWarehouse: string;
}
```

### QuantityStepper

```tsx
interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
}
```

### ItemCard

```tsx
interface ItemCardProps {
  item: MovementItem;
  onEdit: () => void;
  onRemove: () => void;
}
```

### MobileFooterActions

```tsx
interface MobileFooterActionsProps {
  primaryAction: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'blue' | 'emerald';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  progress?: {
    current: number;
    label: string;
  };
}
```

---

## Integrações com API

### Endpoints Utilizados

| Endpoint | Fase | Cache |
|----------|------|-------|
| GET /api/warehouses | Setup | SWR 5min |
| GET /api/products/search?q={query}&warehouseId={id} | Addition | Nenhum (debounce 300ms) |
| GET /api/products/barcode/{code} | Addition (scan) | Nenhum |
| GET /api/batches/warehouse/{warehouseId}/product/{productId} | Addition | Nenhum |
| POST /api/stock-movements | Review | N/A |
| POST /api/stock-movements/{id}/execute | Review (se toggle) | N/A |

### Tratamento de Erros

| Erro | Comportamento |
|------|---------------|
| Produto não encontrado (scan) | Toast + mantém câmera aberta |
| Sem lotes disponíveis | Sheet mostra estado vazio + botão voltar |
| Quantidade > disponível | Stepper bloqueia + tooltip |
| Erro ao criar movimento | Toast + mantém na fase de revisão |
| Erro ao executar | Toast "Criada mas não executada" + vai para detalhes |

---

## Design Visual

### Paleta de Cores (Corporate Solid Dark)

| Uso | Cor |
|-----|-----|
| Background | #0A0A0A |
| Cards/Surfaces | #171717 (neutral-900) |
| Bordas | #262626 (neutral-800) |
| Texto primário | #FFFFFF |
| Texto secundário | #A3A3A3 (neutral-400) |
| Texto desabilitado | #525252 (neutral-600) |
| Primária (ações) | #2563EB (blue-600) |
| Sucesso | #059669 (emerald-600) |
| Erro | #E11D48 (rose-600) |
| Aviso | #F59E0B (amber-500) |

### Especificações de Touch

| Elemento | Tamanho Mínimo |
|----------|---------------|
| Botões de ação | 56px altura |
| Cards clicáveis | 64px altura |
| Ícones de ação | 44x44px área de toque |
| Inputs | 48px altura |
| Stepper buttons | 56x56px |

### Tipografia

| Uso | Especificação |
|-----|---------------|
| Títulos de página | text-xl, font-bold, uppercase |
| Labels | text-[10px], font-bold, uppercase, tracking-wider |
| Corpo | text-sm |
| Valores numéricos | font-mono |
| Botões | text-xs, font-bold, uppercase, tracking-wide |

---

## Responsividade

### Mobile (< 768px) - Foco Principal

- Layout vertical único
- Bottom sheets ao invés de modais
- Footer fixo com ações
- Cards empilhados verticalmente
- Stepper de quantidade grande

### Tablet/Desktop (≥ 768px)

- Mesmo fluxo do mobile (consistência)
- Cards com max-width: 480px centralizados
- Modais ao invés de bottom sheets
- Footer inline ao invés de fixo

---

## Acessibilidade

- Labels explícitos em todos os inputs
- ARIA labels nos botões de ícone
- Foco visível (outline blue-500)
- Navegação por teclado no stepper
- Mensagens de erro vinculadas (aria-describedby)
- Contraste mínimo 4.5:1 para texto

---

## Implementação

### Ordem de Implementação

1. **Componentes base**: Header, Footer, ContextBar, Stepper
2. **Fase 1 (Setup)**: Cards de armazém + Bottom sheet
3. **Fase 2 (Addition)**: Lista de itens + Sheet de adicionar
4. **Integração scanner**: Conectar com BarcodeScannerModal existente
5. **Fase 3 (Review)**: Cards de revisão + toggle
6. **Tela de sucesso**: Layout + navegação
7. **Integração API**: Conectar com endpoints
8. **Testes**: Unitários no model + E2E do fluxo

### Arquivos a Criar/Modificar

**Novos:**
- `_components/mobile-wizard-header.tsx`
- `_components/warehouse-context-bar.tsx`
- `_components/setup-phase.tsx`
- `_components/warehouse-bottom-sheet.tsx`
- `_components/addition-phase.tsx`
- `_components/product-search-input.tsx`
- `_components/add-item-sheet.tsx`
- `_components/item-card.tsx`
- `_components/quantity-stepper.tsx`
- `_components/review-phase.tsx`
- `_components/success-screen.tsx`
- `_components/mobile-footer-actions.tsx`

**Modificar:**
- `stock-movements-create.model.ts` - Adicionar lógica de fases
- `stock-movements-create.view.tsx` - Orquestrar componentes
- `stock-movements-create.types.ts` - Adicionar types do wizard

---

**Design validado e pronto para implementação.**
