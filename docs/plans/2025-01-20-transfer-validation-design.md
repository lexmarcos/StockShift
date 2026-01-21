# Design: Validação de Transferências com Barcode Scanning

**Data:** 2025-01-20
**Status:** Aprovado

---

## Visão Geral

Implementar funcionalidade de validação de transferências internas no warehouse destino. Quando uma transferência é executada, ela entra em status `IN_TRANSIT` e o warehouse destino deve validar os produtos recebidos via barcode scanning antes de adicionar ao estoque.

## Novos Status

| Status | Label PT-BR | Cor | Descrição |
|--------|-------------|-----|-----------|
| `IN_TRANSIT` | EM TRÂNSITO | Azul (`blue-500`) | Transferência executada, aguardando validação no destino |
| `COMPLETED_WITH_DISCREPANCY` | CONCLUÍDO COM DIVERGÊNCIA | Amber (`amber-500`) | Validação concluída com itens faltando |

## Arquivos a Modificar

### 1. `stock-movements.types.ts`
- Adicionar `IN_TRANSIT` e `COMPLETED_WITH_DISCREPANCY` ao tipo `MovementStatus`
- Adicionar tipos para validação (ValidationItem, ValidationProgress, etc.)

### 2. `stock-movements-detail.model.ts`
- Adicionar função `onStartValidation` que chama `POST /api/stock-movements/{id}/validations`
- Adicionar estado `isStartingValidation`

### 3. `stock-movements-detail.view.tsx`
- Adicionar estilos para novos status no `getStatusStyle`
- Adicionar botão "INICIAR VALIDAÇÃO" quando `status === 'IN_TRANSIT'` e `movementType === 'TRANSFER'`
- Adicionar seção de resumo de validação para movimentos já validados

## Arquivos a Criar

### Estrutura da tela de validação:
```
[id]/validate/[validationId]/
├── page.tsx                    # ViewModel
├── validation.model.ts         # Lógica (scanning, API calls)
├── validation.view.tsx         # UI
└── validation.types.ts         # Tipos
```

## Fluxo de Interação

### Tela de Detalhe (IN_TRANSIT)

1. Usuário acessa detalhe de uma transferência `IN_TRANSIT`
2. Vê botão "INICIAR VALIDAÇÃO" (azul, destaque principal)
3. Clica no botão → `POST /api/stock-movements/{id}/validations`
4. Recebe `validationId` → Redireciona para `/stock-movements/{id}/validate/{validationId}`

### Tela de Validação (Scanning)

**Layout:**
```
┌─────────────────────────────────────────┐
│ ← Validação de Transferência            │
│   Origem → Destino                      │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │      📷 SCANNER @yudiel            │ │
│ │      (estilo igual ao de produtos)  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ PROGRESSO ─────────────────────────┐ │
│ │ ████████░░░░░░░░  8/15 itens (53%)  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─ ITENS ─────────────────────────────┐ │
│ │ ✓ Produto A          10/10 COMPLETE │ │
│ │ ◐ Produto B           5/8  PARTIAL  │ │
│ │ ○ Produto C           0/5  PENDING  │ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ [       CONCLUIR VALIDAÇÃO        ]     │
└─────────────────────────────────────────┘
```

**Comportamento do scan:**
1. Escaneia barcode → `POST .../validations/{validationId}/scan` com `{ barcode }`
2. Feedback imediato: visual (verde = sucesso, vermelho = não pertence)
3. Atualiza contador do item na lista
4. Item muda: PENDING → PARTIAL → COMPLETE

**Status dos itens:**
- `PENDING` → Neutral (círculo vazio)
- `PARTIAL` → Amber (círculo meio cheio)
- `COMPLETE` → Emerald (check verde)

### Conclusão da Validação

**Sem divergência:**
- Modal simples de confirmação
- `POST .../validations/{validationId}/complete`
- Status final: `COMPLETED`

**Com divergência:**
- Modal de alerta mostrando itens faltando
- Usuário confirma → `POST .../validations/{validationId}/complete`
- Status final: `COMPLETED_WITH_DISCREPANCY`
- Gera relatório de divergência disponível para download

### Pós-Validação (Tela de Detalhe)

- Seção "Validação" com resumo do recebimento
- Se divergência: botões para download do relatório (PDF/Excel)
- Chamada: `GET .../validations/{validationId}/discrepancy-report`

## Componentes Reutilizados

- `Scanner` de `@yudiel/react-qr-scanner` (mesmo padrão do `scanner-drawer.tsx`)
- Overlay com linha verde pulsante e corner markers
- Formatos: `ean_13`, `ean_8`, `code_128`, `code_39`, `upc_a`, `upc_e`

## Endpoints Utilizados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/stock-movements/{id}/validations` | Iniciar validação |
| POST | `/api/stock-movements/{id}/validations/{validationId}/scan` | Escanear barcode |
| GET | `/api/stock-movements/{id}/validations/{validationId}` | Obter progresso |
| POST | `/api/stock-movements/{id}/validations/{validationId}/complete` | Concluir validação |
| GET | `/api/stock-movements/{id}/validations/{validationId}/discrepancy-report` | Download relatório |

## Design Visual

Seguindo o padrão "Corporate Solid Dark (Vivid)":
- Background: `#0A0A0A`
- Cards: `#171717` com border `neutral-800`
- Radius: `4px` em tudo
- Scanner overlay: linha verde `#00FF41` pulsante
- Feedback de scan: cores vivid (emerald sucesso, rose erro)

## Permissões

- Validação requer: `STOCK_MOVEMENT_EXECUTE` ou `ROLE_ADMIN`
- Backend valida se usuário pode validar (pertence ao warehouse destino)
- Frontend apenas mostra/esconde botões baseado no status do movimento
