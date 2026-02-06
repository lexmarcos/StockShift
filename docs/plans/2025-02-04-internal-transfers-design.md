# Design: Transferências Internas entre Warehouses

## Resumo

Sistema de transferência de produtos entre warehouses, onde o warehouse origem cria e executa a transferência, e o warehouse destino valida o recebimento via scanner de código de barras.

## Fluxo de Status

```
DRAFT → IN_TRANSIT → IN_VALIDATION → COMPLETED
                ↓           ↓
            CANCELLED   CANCELLED
```

## Decisões de Design

| Aspecto | Decisão |
|---------|---------|
| Listagem | Abas separadas: "Enviadas" e "Recebidas" |
| Criação | Página separada com formulário inline |
| Seleção de itens | Produto → Batch → Quantidade |
| Validação | Scanner-first com input manual de barcode |
| Discrepâncias | Tempo real + modal de confirmação |
| Menu | Item direto "Transferências" no sidebar |
| Detalhe | Card único com seções |

---

## Estrutura de Rotas

```
/transfers              → Lista com abas (Enviadas | Recebidas)
/transfers/new          → Criar nova transferência
/transfers/[id]         → Detalhe da transferência
/transfers/[id]/validate → Tela de validação/recebimento (scanner)
```

## Estrutura de Arquivos (MVVM)

```
app/(pages)/transfers/
├── page.tsx
├── transfers.model.ts
├── transfers.view.tsx
├── transfers.types.ts
├── new/
│   ├── page.tsx
│   ├── new-transfer.model.ts
│   ├── new-transfer.view.tsx
│   ├── new-transfer.schema.ts
│   └── new-transfer.types.ts
├── [id]/
│   ├── page.tsx
│   ├── transfer-detail.model.ts
│   ├── transfer-detail.view.tsx
│   └── transfer-detail.types.ts
│   └── validate/
│       ├── page.tsx
│       ├── validate-transfer.model.ts
│       ├── validate-transfer.view.tsx
│       └── validate-transfer.types.ts
```

---

## Página: Listagem (`/transfers`)

### Layout

- **Header**: Título "Transferências" + botão "Nova Transferência" (só na aba "Enviadas")
- **Abas**: "Enviadas" | "Recebidas"
- **Lista**: Cards com transferências filtradas

### Aba "Enviadas" (source = warehouse atual)

| Status | Ações |
|--------|-------|
| `DRAFT` | Editar, Executar, Cancelar |
| `IN_TRANSIT` | Cancelar (com motivo) |
| `IN_VALIDATION` | Visualizar apenas |
| `COMPLETED` | Visualizar apenas |
| `CANCELLED` | Visualizar apenas |

### Aba "Recebidas" (destination = warehouse atual)

| Status | Ações |
|--------|-------|
| `IN_TRANSIT` | Iniciar Validação |
| `IN_VALIDATION` | Continuar Validação |
| `COMPLETED` | Visualizar relatório |
| `CANCELLED` | Visualizar apenas |

*Nota: Transferências em `DRAFT` não aparecem aqui*

### Card de Transferência

```
┌─────────────────────────────────────────────┐
│ ● TRF-2026-0001                    IN_TRANSIT│
│   Warehouse A → Warehouse B                  │
│   3 itens · Criado em 04/02/2026            │
└─────────────────────────────────────────────┘
```

- Borda esquerda colorida por status
- Código em destaque
- Badge de status no canto

---

## Página: Criação (`/transfers/new`)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ← Voltar                                                    │
│                                                             │
│ NOVA TRANSFERÊNCIA                                          │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Warehouse Destino                                       │ │
│ │ [Select - Escolha o warehouse destino ▼]                │ │
│ │                                                         │ │
│ │ Observações (opcional)                                  │ │
│ │ [________________________________]                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ITENS DA TRANSFERÊNCIA                    [+ Adicionar Item]│
│                                                             │
│ (Lista de itens adicionados)                                │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│ │ (Footer fixo)                  [CRIAR TRANSFERÊNCIA]   │ │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Adicionar Item

1. Usuário busca/seleciona **produto**
2. Select de **lotes** é populado com batches do produto (mostrando quantidade disponível)
3. Usuário define **quantidade** (máximo = disponível no lote)
4. Clica "Adicionar" → item aparece na lista
5. Pode adicionar mais itens ou criar

### Request Body (POST /transfers)

```json
{
  "destinationWarehouseId": "uuid",
  "notes": "string (opcional)",
  "items": [
    { "sourceBatchId": "uuid", "quantity": 10.5 }
  ]
}
```

---

## Página: Detalhe (`/transfers/[id]`)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ← Voltar                                                    │
│                                                             │
│ TRF-2026-0001                              [Badge: STATUS]  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ INFORMAÇÕES                                             │ │
│ │ Origem → Destino                                        │ │
│ │ Datas de criação/atualização                           │ │
│ │ Observações                                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ITENS (N)                                                   │
│ (Lista de itens com lote e quantidade)                      │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│ │ (Footer com ações baseadas em status + papel)          │ │
└─────────────────────────────────────────────────────────────┘
```

### Ações por Papel

**Se sou origem:**

| Status | Ações |
|--------|-------|
| `DRAFT` | Cancelar, Editar, EXECUTAR |
| `IN_TRANSIT` | Cancelar Transferência |
| Outros | Sem ações |

**Se sou destino:**

| Status | Ações |
|--------|-------|
| `IN_TRANSIT` | INICIAR VALIDAÇÃO |
| `IN_VALIDATION` | CONTINUAR VALIDAÇÃO |
| `COMPLETED` | Ver Relatório |

---

## Página: Validação (`/transfers/[id]/validate`)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ← Voltar                                                    │
│                                                             │
│ VALIDAÇÃO · TRF-2026-0001                                   │
│ Warehouse A → Warehouse B                                   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔍 Escanear ou digitar código de barras                 │ │
│ │ [____________________________________] [ADICIONAR]      │ │
│ │ ✓ Último: Perfume XYZ (7891234567890)                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ PROGRESSO                                      2/3 itens    │
│ [████████████████████░░░░░░░░░░] 66%                        │
│                                                             │
│ ITENS ESPERADOS                                             │
│ (Lista com status de cada item: recebido/esperado)          │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│ │                          [FINALIZAR VALIDAÇÃO]         │ │
└─────────────────────────────────────────────────────────────┘
```

### Comportamento do Scanner

1. Input com **autofocus**
2. Após scan, **limpa campo** e mantém foco
3. Mostra **feedback visual** do último item
4. Atualiza lista em **tempo real**

### Estados dos Itens

| Estado | Visual |
|--------|--------|
| Completo (recebido = enviado) | ✓ verde + `border-l-emerald-600` |
| Parcial (recebido < enviado) | ◐ amber + `border-l-amber-500` |
| Não iniciado (recebido = 0) | ○ neutro + `border-l-neutral-600` |
| Sobra (recebido > enviado) | ⚠ rose + `border-l-rose-600` |

### Modal de Confirmação

Ao clicar "Finalizar Validação":

1. Chama `GET /transfers/{id}/discrepancy-report`
2. Exibe modal com lista de faltas/sobras
3. Usuário confirma → `POST /transfers/{id}/complete-validation`

---

## Cores de Status

| Status | Cor | Classe |
|--------|-----|--------|
| DRAFT | Azul | `border-l-blue-600`, `bg-blue-500/10`, `text-blue-500` |
| IN_TRANSIT | Amber | `border-l-amber-500`, `bg-amber-500/10`, `text-amber-500` |
| IN_VALIDATION | Roxo | `border-l-purple-500`, `bg-purple-500/10`, `text-purple-500` |
| COMPLETED | Verde | `border-l-emerald-600`, `bg-emerald-500/10`, `text-emerald-500` |
| CANCELLED | Neutro | `border-l-neutral-600`, `bg-neutral-500/10`, `text-neutral-500` |

---

## Sidebar

Adicionar item "Transferências" ao menu lateral:

```tsx
{
  title: "Transferências",
  href: "/transfers",
  icon: ArrowLeftRight, // ou Repeat
}
```

Posição: Após itens de inventário existentes.

---

## Endpoints Utilizados

| Ação | Endpoint |
|------|----------|
| Listar | `GET /transfers?sourceWarehouseId=X` ou `destinationWarehouseId=X` |
| Criar | `POST /transfers` |
| Detalhe | `GET /transfers/{id}` |
| Atualizar (draft) | `PATCH /transfers/{id}` |
| Executar | `POST /transfers/{id}/execute` |
| Iniciar validação | `POST /transfers/{id}/start-validation` |
| Escanear | `POST /transfers/{id}/scan` |
| Relatório discrepâncias | `GET /transfers/{id}/discrepancy-report` |
| Finalizar validação | `POST /transfers/{id}/complete-validation` |
| Cancelar | `DELETE /transfers/{id}` |
