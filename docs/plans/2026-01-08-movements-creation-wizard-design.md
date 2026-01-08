# Módulo de Criação de Movimentações - Design

**Data**: 2026-01-08
**Tipo**: Design de Feature
**Escopo**: Wizard de criação de movimentações de estoque

---

## Visão Geral

Implementação de wizard multi-step para criação de movimentações de estoque (ENTRY, EXIT, TRANSFER, ADJUSTMENT) seguindo arquitetura MVVM e filosofia Corporate Solid Dark.

### Decisões de Design

1. **Wizard Multi-Step**: Processo guiado em 4 etapas para melhor UX em mobile
2. **Autocomplete + Dialog de Lotes**: Melhor visualização de opções disponíveis
3. **Criar como PENDING + Opção de Executar**: Controle total ao usuário, permite rascunhos

---

## Arquitetura

### Estrutura de Pastas

```
app/movements/
├── movements.types.ts              # Types compartilhados do módulo
├── movements.schema.ts             # Schemas Zod compartilhados
└── create/
    ├── page.tsx                    # ViewModel do wizard
    ├── create.model.ts             # Lógica do wizard
    ├── create.view.tsx             # JSX do wizard
    ├── create.types.ts             # Types específicos do wizard
    └── _components/
        ├── wizard-stepper.tsx      # Stepper visual de progresso
        ├── step-1-movement-type.tsx
        ├── step-2-warehouses.tsx
        ├── step-3-items.tsx
        ├── step-4-review.tsx
        ├── product-autocomplete.tsx
        ├── batch-selection-dialog.tsx
        ├── item-list-table.tsx     # Lista de itens (desktop)
        ├── item-list-cards.tsx     # Lista de itens (mobile)
        └── navigation-buttons.tsx  # Botões Voltar/Próximo
```

### Estado do Wizard

```typescript
interface WizardState {
  currentStep: 1 | 2 | 3 | 4;
  isStepValid: Record<1 | 2 | 3 | 4, boolean>;

  step1Data: {
    movementType: 'ENTRY' | 'EXIT' | 'TRANSFER' | 'ADJUSTMENT' | null;
  };

  step2Data: {
    sourceWarehouseId: string | null;
    destinationWarehouseId: string | null;
    notes: string;
  };

  step3Data: {
    items: MovementItem[];
  };

  step4Data: {
    executeImmediately: boolean;
  };

  isSubmitting: boolean;
  submitError: string | null;
}
```

---

## Steps do Wizard

### Step 1: Seleção do Tipo de Movimentação

**Objetivo**: Escolher o tipo de movimentação (define comportamento dos próximos steps)

**Interface**:
- 4 cards em grid (2 colunas mobile, 4 desktop)
- Cada card contém:
  - Ícone lucide (PackagePlus, PackageMinus, ArrowRightLeft, ClipboardList)
  - Nome em português (Entrada, Saída, Transferência, Ajuste)
  - Descrição breve do propósito

**Tipos e Regras**:
- **ENTRY**: `sourceWarehouseId: null`, `destinationWarehouseId: required`
- **EXIT**: `sourceWarehouseId: required`, `destinationWarehouseId: null`
- **TRANSFER**: ambos required, origem ≠ destino
- **ADJUSTMENT**: `sourceWarehouseId: required`, `destinationWarehouseId: null`

**Validação**:
```typescript
z.object({
  movementType: z.enum(['ENTRY', 'EXIT', 'TRANSFER', 'ADJUSTMENT'])
})
```

---

### Step 2: Seleção de Armazéns

**Objetivo**: Selecionar armazém(ns) baseado no tipo escolhido

**Campos Dinâmicos por Tipo**:

**ENTRY**:
- Apenas "Armazém de Destino" (obrigatório)
- Helper: "Para qual armazém?"

**EXIT**:
- Apenas "Armazém de Origem" (obrigatório)
- Helper: "Apenas produtos com estoque disponível neste armazém poderão ser adicionados"

**TRANSFER**:
- "Armazém de Origem" e "Armazém de Destino" (ambos obrigatórios)
- Layout com ícone de seta (→) entre selects
- Validação: origem ≠ destino

**ADJUSTMENT**:
- Apenas "Armazém" (obrigatório)
- Helper: "Ajuste de inventário para correções ou contagens físicas"

**Campo Adicional (todos)**:
- Textarea "Observações" (opcional)
- Placeholder contextual por tipo

**Data Fetching**:
- Endpoint: `GET /api/warehouses`
- SWR com cache de 5 minutos
- Skeleton loader durante carregamento

**Validação**:
```typescript
z.object({
  sourceWarehouseId: z.string().uuid().nullable(),
  destinationWarehouseId: z.string().uuid().nullable(),
  notes: z.string().optional()
}).refine(/* regras baseadas no movementType */)
```

---

### Step 3: Adicionar Itens

**Objetivo**: Construir lista de produtos/lotes/quantidades

**Interface Principal**:
- Botão "Adicionar Produto" (destaque no topo)
- Lista de itens adicionados (tabela desktop, cards mobile)
- Estado vazio: Ícone + texto motivacional

**Fluxo de Adicionar Item**:

1. **Click "Adicionar Produto"** → Abre dialog

2. **Dialog - Buscar Produto**:
   - Autocomplete com server-side search
   - Endpoint: `GET /api/products/search?q={query}`
   - Debounce: 300ms
   - Mínimo: 2 caracteres
   - Mostra: Nome, SKU, código de barras

3. **Dialog - Selecionar Lote** (condicional):

   **Para EXIT/TRANSFER/ADJUSTMENT**:
   - Endpoint: `GET /api/warehouses/{warehouseId}/products/{productId}/batches`
   - Tabela/lista de lotes com:
     - Número do lote
     - Quantidade disponível (destaque)
     - Data de validade (warning se próximo)
     - Data de fabricação
   - Ordenação FEFO (First Expire, First Out)
   - Validação: não permitir lotes com quantidade zero

   **Para ENTRY**:
   - Campo opcional "Número do Lote" (texto livre)
   - Helper: "Deixe em branco para criar novo lote automaticamente"

4. **Dialog - Definir Quantidade**:
   - Input numérico (obrigatório, > 0)
   - Para EXIT/TRANSFER: máximo = quantidade disponível
   - Campo opcional: "Motivo específico" (textarea)

5. **Adicionar à Lista**:
   - Valida todos os campos
   - Adiciona ao array
   - Toast: "Item adicionado"
   - Fecha dialog

**Gestão da Lista**:
- Editar: Reabre dialog com dados
- Remover: Confirmação simples
- Validação: Mínimo 1 item
- Prevenir duplicatas: mesmo produto + lote

**Validação**:
```typescript
itemSchema = z.object({
  productId: z.string().uuid(),
  batchId: z.string().uuid().nullable(),
  quantity: z.number().int().positive(),
  reason: z.string().optional()
})

step3Schema = z.object({
  items: z.array(itemSchema).min(1, "Adicione pelo menos um item")
})
```

---

### Step 4: Revisão e Confirmação

**Objetivo**: Revisar tudo, escolher se executa imediatamente, criar movimentação

**Layout**:

**Seção 1 - Informações Gerais**:
- Tipo: Badge com ícone + nome
- Armazéns: Exibição contextual por tipo
- Observações: Texto completo ou "-"
- Botões "Editar" para voltar aos steps

**Seção 2 - Itens da Movimentação**:
- Header: "Itens (X)"
- Tabela responsiva (desktop) / Cards (mobile)
- Colunas: Produto, Lote, Quantidade, Motivo
- Rodapé: Total de itens e quantidade total
- Botão "Editar Itens"

**Seção 3 - Opções de Execução**:
- Checkbox: "Executar movimentação imediatamente"
  - Default: desmarcado (cria como PENDING)
  - Helper text contextual
- Alert de aviso (se marcado):
  - "Atenção: Após executar, a movimentação não poderá ser editada ou cancelada"
  - Ícone AlertTriangle

**Botões de Ação**:
- Voltar (secondary)
- Criar Movimentação (primary)
  - Texto condicional:
    - Desmarcado: "Criar como Rascunho"
    - Marcado: "Criar e Executar"
  - Loading state durante requisição

**Fluxo de Submissão**:
1. Valida todos os steps novamente
2. POST `/api/stock-movements`
3. Se checkbox marcado:
   - Aguarda resposta (PENDING)
   - POST `/api/stock-movements/{id}/execute`
4. Sucesso: Redireciona para `/movements/{id}`
5. Erro: Toast + mantém no step 4

---

## Navegação do Wizard

### Stepper Visual

**Desktop**:
- Barra horizontal no topo
- 4 círculos conectados por linha
- Estados: Completo (check), Atual (número), Futuro (locked)
- Clickable apenas para steps completos

**Mobile**:
- Barra compacta com progresso
- Texto: "Passo X de 4: [Nome]"
- Barra de progresso (25%, 50%, 75%, 100%)
- Não clickable

**Nomes dos Steps**:
1. Tipo de Movimentação
2. Armazéns
3. Adicionar Itens
4. Revisão e Confirmação

### Botões de Navegação

**Posicionamento**:
- Mobile: Fixos no bottom (sticky footer)
- Desktop: Inline ao final do conteúdo

**Comportamento**:
- **Avançar**: Valida step atual, só avança se válido
- **Voltar**: Sempre permitido, mantém dados
- **Navegação direta**: Via stepper, apenas para steps já validados

### Draft Automático

- Salvar no localStorage a cada mudança
- Chave: `movement-draft-{timestamp}`
- Ao abrir `/movements/create`: Modal "Continuar ou começar nova?"
- Limpar após criação bem-sucedida

### Confirmação de Saída

- Se houver dados e usuário tentar sair
- Modal: "Salvar como rascunho, Descartar ou Continuar?"

---

## Integrações com API

### Endpoints Utilizados

1. **GET /api/warehouses**
   - Cache: SWR, 5 minutos
   - Usado no Step 2

2. **GET /api/products/search?q={query}&warehouseId={id}**
   - Debounce: 300ms
   - Cache: desabilitado
   - Usado no Step 3

3. **GET /api/warehouses/{warehouseId}/products/{productId}/batches**
   - Cache: desabilitado (dados críticos)
   - Usado no Step 3

4. **POST /api/stock-movements**
   - Timeout: 30 segundos
   - Usado no Step 4

5. **POST /api/stock-movements/{id}/execute**
   - Timeout: 60 segundos
   - Condicional (Step 4)

### Tratamento de Erros

**400 - Validação**:
- Mapeia erros para campos específicos
- Permite voltar ao step com erro

**400 - Estoque Insuficiente**:
```json
{
  "productId": "...",
  "requested": 100,
  "available": 50
}
```
- Toast específico com detalhes
- Volta para Step 3 com item destacado

**403 - Sem Permissão**:
- Toast informativo
- Redireciona para home

**500 - Erro do Servidor**:
- Toast genérico
- Mantém dados no formulário

**Sucesso Parcial** (criado mas falhou ao executar):
- Toast: "Criada, mas não foi possível executar. Execute manualmente."
- Redireciona para detalhes

---

## Design Visual

### Filosofia Corporate Solid Dark

**Paleta de Cores**:
- Fundo principal: Cinza escuro
- Cards/Steps: Cinza médio
- Bordas: Cinza claro sutil (1px)
- Estados selecionados: Cinza mais claro
- Textos primários: Branco
- Textos secundários: Cinza claro

**Badges de Tipo** (escala de cinza):
- ENTRY: Cinza claro + PackagePlus
- EXIT: Cinza médio-escuro + PackageMinus
- TRANSFER: Cinza médio + ArrowRightLeft
- ADJUSTMENT: Cinza médio-claro + ClipboardList

### Componentes

**Cards de Seleção (Step 1)**:
- Border-radius: 4px (máximo)
- Border: 1px padrão, 2px selecionado
- Hover: Clareamento 4-6%
- Sem sombras, sem animações
- Height mínimo: 140px

**Selects/Combobox (Step 2)**:
- Altura: 44px (touch-friendly)
- Border-radius: 4px
- Fundo: Cinza médio sobre escuro

**Dialog de Produtos (Step 3)**:
- Mobile: Full screen
- Desktop: Max-width 600px
- Header com título + botão X
- Body scrollable (max-height: 60vh)

**Tabela de Lotes**:
- Desktop: Tabela tradicional
- Mobile: Cards empilhados
- Ordenação FEFO
- Warning se < 30 dias para vencer

**Lista de Itens**:
- Desktop: Tabela com ações
- Mobile: Cards com todas as informações
- Estado vazio: Ícone 64px + texto

### Responsividade Mobile First

**Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Ajustes Mobile**:
- Stepper compacto
- Botões fixos no bottom
- Dialog full-screen
- Cards ao invés de tabelas
- Font-size mínimo 16px
- Touch targets mínimo 44x44px

**Ajustes Desktop**:
- Stepper visual completo
- Botões inline
- Modals centrados
- Tabelas para dados
- Layout em grid

### Acessibilidade

- Labels explícitos em todos os campos
- ARIA labels nos ícones
- Foco visível (outline cinza claro)
- Navegação por teclado:
  - Enter: avançar steps
  - ESC: fechar modals
- Mensagens de erro linkadas (aria-describedby)

### Feedback Visual

**Toasts**:
- Sucesso: Cinza claro + CheckCircle
- Erro: Cinza escuro + XCircle
- Warning: Cinza médio + AlertTriangle
- Duração: 4 segundos
- Posição mobile: bottom-center
- Posição desktop: top-right

**Loading States**:
- Step 2: Skeleton nos selects
- Step 3: Spinner no autocomplete, skeleton na tabela
- Step 4: Botão com spinner + disabled

---

## Stack Tecnológica

- **Framework**: Next.js 15 (App Router)
- **Validação**: Zod (schemas por step + global)
- **Forms**: react-hook-form
- **HTTP**: ky
- **Data Fetching**: SWR
- **UI Components**: shadcn/ui (Dialog, Select, Input, Button, Badge, Card, Checkbox, Alert)
- **Icons**: lucide-react
- **Toast**: sonner
- **State**: useState + useReducer
- **Storage**: localStorage (drafts)

---

## Próximos Passos

### Fora do Escopo Atual

- Listagem de movimentações (`/movements`)
- Detalhes da movimentação (`/movements/{id}`)
- Edição de movimentações pendentes
- Filtros e busca na listagem
- Exportação de movimentações
- Templates de movimentações comuns

### Implementação

1. Criar estrutura de pastas e arquivos base
2. Implementar types e schemas Zod
3. Criar componentes de UI (Steps 1-4)
4. Implementar lógica do wizard (model)
5. Integrar com APIs
6. Implementar responsividade
7. Testes unitários do model
8. Testes de integração

---

## Desafios Técnicos Identificados

1. Gerenciamento de estado complexo do wizard
2. Validação contextual baseada no tipo de movimentação
3. Seleção de lotes com FEFO e validação de estoque
4. Responsividade do dialog/modal em mobile
5. Recovery de draft do localStorage

---

**Design validado e pronto para implementação.**
